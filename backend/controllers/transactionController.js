const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");
const { recalculateWalletBalance } = require("../services/walletService");
const { cloudinary } = require("../middleware/uploadmiddleware");
const { evaluateBudgetAlerts } = require("../utils/budgetEvaluation");
const { processGoalAutoContributions } = require("../utils/goalEvaluation");
const searchService = require("../services/searchService");
 
/**
 * @desc    Create new Income or Expense transaction with optional receipt URL
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = async (req, res) => {
    try {
        const { wallet, type, amount, category, subCategory, tags, merchant, notes, date, taxIncluded, taxRate, splitWith } = req.body;
 
        // Verify wallet ownership
        const walletExists = await Wallet.findOne({ _id: wallet, user: req.user._id });
        if (!walletExists) {
            return res.status(404).json({ message: "Wallet not found or unauthorized." });
        }
 
        const transaction = new Transaction({
            user: req.user._id,
            wallet,
            type: type?.toUpperCase(),
            amount: Number(amount),
            currency: walletExists.currency,
            category,
            subCategory,
            tags: Array.isArray(tags) ? tags : tags ? tags.split(",").map(t => t.trim()) : [],
            merchant,
            receiptUrl: req.body.receiptUrl || null,
            receiptPublicId: req.body.receiptPublicId || null,
            notes,
            date: date ? new Date(date) : new Date(),
            taxIncluded: taxIncluded === "true" || taxIncluded === true,
            taxRate: taxRate ? Number(taxRate) : 0,
            splitWith: Array.isArray(splitWith) ? splitWith : []
        });
 
        // Save transaction (This triggers Mongoose post-save hook which updates Wallet balance!)
        await transaction.save();
 
        // Evaluate budget alerts if EXPENSE
        let budgetAlerts = [];
        if (transaction.type === "EXPENSE") {
            budgetAlerts = await evaluateBudgetAlerts(req.user._id, transaction.category, transaction.date, transaction.amount);
        }

        // Process automatic goal contributions if INCOME
        let goalContributions = [];
        if (transaction.type === "INCOME") {
            goalContributions = await processGoalAutoContributions(req.user._id, transaction.amount);
        }
 
        // Update Search Trie
        await searchService.addTransaction(req.user._id, transaction);

        return res.status(201).json({
            message: "Transaction created successfully and wallet balance synced!",
            transaction,
            budgetAlerts,
            goalContributions
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to create transaction.", error: error.message });
    }
};
 
/**
 * @desc    Get all user transactions with advanced filtering & pagination
 * @route   GET /api/transactions
 * @access  Private
 */
const getTransactions = async (req, res) => {
    try {
        const { wallet, type, category, startDate, endDate, search, page = 1, limit = 20 } = req.query;
        const query = { user: req.user._id };
 
        if (wallet) query.wallet = wallet;
        if (type) query.type = type.toUpperCase();
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Full-text style search across merchant, notes, category, and tags
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { merchant: regex },
                { notes: regex },
                { category: regex },
                { tags: regex }
            ];
        }
 
        const transactions = await Transaction.find(query)
            .populate("wallet", "name type color currency")
            .sort({ date: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
 
        const totalCount = await Transaction.countDocuments(query);
 
        return res.status(200).json({
            transactions,
            currentPage: Number(page),
            totalPages: Math.ceil(totalCount / Number(limit)),
            totalCount
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch transactions.", error: error.message });
    }
};
 
/**
 * @desc    Update existing transaction and resync wallet balance precisely
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
const updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found." });
        }
 
        const oldWalletId = transaction.wallet.toString();
        const newWalletId = req.body.wallet || oldWalletId;
 
        // If replacing receipt image, delete the old image from Cloudinary
        if (req.body.receiptPublicId && transaction.receiptPublicId && req.body.receiptPublicId !== transaction.receiptPublicId) {
            await cloudinary.uploader.destroy(transaction.receiptPublicId).catch(err => console.error("Cloudinary delete error:", err));
        }
 
        // Keep a copy of the old transaction for trie updating
        const oldTransaction = transaction.toObject();

        // Update fields
        Object.assign(transaction, req.body);
        if (req.body.amount) transaction.amount = Number(req.body.amount);
        await transaction.save();
 
        // Update Search Trie
        await searchService.updateTransaction(req.user._id, oldTransaction, transaction);
 
        // Recalculate balances for old wallet AND new wallet (if wallet was changed during edit)
        await recalculateWalletBalance(oldWalletId);
        if (newWalletId !== oldWalletId) {
            await recalculateWalletBalance(newWalletId);
        }
 
        return res.status(200).json({
            message: "Transaction updated and wallet balances synchronized!",
            transaction
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update transaction.", error: error.message });
    }
};
 
/**
 * @desc    Delete transaction, remove Cloudinary receipt, and reverse balance impact
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found." });
        }
 
        // Delete associated receipt from Cloudinary CDN to prevent storage leaks
        if (transaction.receiptPublicId) {
            await cloudinary.uploader.destroy(transaction.receiptPublicId).catch(err => console.error("Cloudinary delete error:", err));
        }
 
        // Note: Our post('findOneAndDelete') hook automatically reverts the wallet balance!
        // Or run explicit recalculation:
        // await recalculateWalletBalance(transaction.wallet);
 
        // Update Search Trie
        await searchService.removeTransaction(req.user._id, transaction);
 
        return res.status(200).json({
            message: "Transaction deleted, receipt removed from CDN, and wallet balance reverted accurately."
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete transaction.", error: error.message });
    }
};
 
/**
 * @desc    Parse a bill image/PDF and return extracted structured data
 * @route   POST /api/transactions/parse-bill
 * @access  Private
 */
const parseBillFromUpload = async (req, res) => {
    try {
        // The file has been uploaded to Cloudinary via handleReceiptUpload middleware
        // req.body.receiptUrl and req.body.receiptPublicId are now available
        const { receiptUrl, receiptPublicId } = req.body;

        if (!receiptUrl && !req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        // Use the original filename for regex-based extraction
        const filename = req.file?.originalname || '';

        // Build a text string to extract from (filename + URL path)
        const combined = `${filename} ${receiptUrl || ''}`;

        // Amount patterns
        let amount = null;
        const amountPatterns = [
            /(?:total|amount|grand\s*total|net\s*(?:amount|payable))[:\s]*[\u20B9$€£]?\s*([\d,]+\.?\d*)/i,
            /[\u20B9$€£]\s*([\d,]+\.?\d*)/,
            /(?:Rs\.?|INR|USD)\s*([\d,]+\.?\d*)/i,
        ];
        for (const p of amountPatterns) {
            const m = combined.match(p);
            if (m) { amount = m[1].replace(/,/g, ''); break; }
        }

        // Date patterns
        let date = null;
        const datePatterns = [
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
            /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
        ];
        for (const p of datePatterns) {
            const m = combined.match(p);
            if (m) {
                const parsed = new Date(m[0]);
                if (!isNaN(parsed.getTime())) date = parsed.toISOString().split('T')[0];
                break;
            }
        }

        // Category detection
        const categoryKeywords = {
            'Utilities & Bills': ['electricity', 'water', 'gas', 'internet', 'broadband', 'mobile', 'bill'],
            'Food & Dining':     ['restaurant', 'food', 'cafe', 'dining', 'swiggy', 'zomato'],
            'Shopping':          ['amazon', 'flipkart', 'shop', 'store'],
            'Transportation':    ['uber', 'ola', 'fuel', 'petrol', 'cab'],
            'Healthcare & Fitness': ['hospital', 'pharmacy', 'medical', 'doctor', 'clinic'],
            'Entertainment':     ['netflix', 'spotify', 'subscription'],
            'Housing & Rent':    ['rent', 'lease', 'maintenance'],
        };

        const lowerCombined = combined.toLowerCase();
        let category = 'Other Expense';
        for (const [cat, kws] of Object.entries(categoryKeywords)) {
            if (kws.some(kw => lowerCombined.includes(kw))) { category = cat; break; }
        }

        // Merchant (filename without extension, cleaned up)
        const merchantRaw = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        const merchant = merchantRaw.trim().substring(0, 60) || null;

        return res.status(200).json({
            extracted: { amount, date, category, merchant },
            receiptUrl: receiptUrl || null,
            receiptPublicId: receiptPublicId || null,
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to parse bill.", error: error.message });
    }
};

module.exports = {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    parseBillFromUpload
};
