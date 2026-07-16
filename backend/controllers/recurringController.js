const RecurringTransaction = require("../models/recurring");
const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");

/**
 * @desc    Create recurring transaction rule
 * @route   POST /api/recurring
 * @access  Private
 */
const createRecurringTransaction = async (req, res) => {
    try {
        const { wallet, type, amount, category, subCategory, frequency, nextRunDate, notes, isActive = true } = req.body;

        if (!wallet || !type || !amount || !category || !frequency || !nextRunDate) {
            return res.status(400).json({ message: "Wallet, type, amount, category, frequency, and nextRunDate are required." });
        }

        const walletExists = await Wallet.findOne({ _id: wallet, user: req.user._id });
        if (!walletExists) {
            return res.status(404).json({ message: "Wallet not found or unauthorized." });
        }

        const recurring = new RecurringTransaction({
            user: req.user._id,
            wallet,
            type: type.toUpperCase(),
            amount: Number(amount),
            category: category.trim(),
            subCategory: subCategory ? subCategory.trim() : null,
            frequency: frequency.toUpperCase(),
            nextRunDate: new Date(nextRunDate),
            isActive: Boolean(isActive),
            notes
        });

        await recurring.save();

        return res.status(201).json({
            message: "Recurring transaction rule created successfully!",
            recurring
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to create recurring transaction rule.", error: error.message });
    }
};

/**
 * @desc    Get all recurring transaction schedules for user
 * @route   GET /api/recurring
 * @access  Private
 */
const getRecurringTransactions = async (req, res) => {
    try {
        const recurringList = await RecurringTransaction.find({ user: req.user._id })
            .populate("wallet", "name type color currency")
            .sort({ nextRunDate: 1 });

        return res.status(200).json({ recurringTransactions: recurringList });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch recurring transactions.", error: error.message });
    }
};

/**
 * @desc    Update recurring schedule or toggle active state
 * @route   PUT /api/recurring/:id
 * @access  Private
 */
const updateRecurringTransaction = async (req, res) => {
    try {
        const recurring = await RecurringTransaction.findOne({ _id: req.params.id, user: req.user._id });
        if (!recurring) {
            return res.status(404).json({ message: "Recurring transaction not found." });
        }

        Object.assign(recurring, req.body);
        if (req.body.amount) recurring.amount = Number(req.body.amount);
        if (req.body.nextRunDate) recurring.nextRunDate = new Date(req.body.nextRunDate);

        await recurring.save();

        return res.status(200).json({
            message: "Recurring schedule updated successfully!",
            recurring
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update recurring schedule.", error: error.message });
    }
};

/**
 * @desc    Delete recurring schedule
 * @route   DELETE /api/recurring/:id
 * @access  Private
 */
const deleteRecurringTransaction = async (req, res) => {
    try {
        const recurring = await RecurringTransaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!recurring) {
            return res.status(404).json({ message: "Recurring schedule not found." });
        }

        return res.status(200).json({ message: "Recurring schedule deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete recurring schedule.", error: error.message });
    }
};

/**
 * @desc    Process all due recurring transactions (where nextRunDate <= now)
 *          Creates real transactions and advances nextRunDate based on frequency
 * @route   POST /api/recurring/process
 * @access  Private / Utility
 */
const processDueRecurringTransactions = async (req, res) => {
    try {
        const now = new Date();
        const dueRecurring = await RecurringTransaction.find({
            user: req.user._id,
            isActive: true,
            nextRunDate: { $lte: now }
        }).populate("wallet");

        if (!dueRecurring || dueRecurring.length === 0) {
            return res.status(200).json({
                message: "No due recurring transactions to process right now.",
                processedCount: 0,
                transactionsCreated: []
            });
        }

        const transactionsCreated = [];

        for (const rule of dueRecurring) {
            // Create actual transaction
            const transaction = new Transaction({
                user: rule.user,
                wallet: rule.wallet._id,
                type: rule.type,
                amount: rule.amount,
                currency: rule.wallet?.currency || "INR",
                category: rule.category,
                subCategory: rule.subCategory,
                merchant: "Recurring Auto-Execution",
                notes: rule.notes || `Automated recurring ${rule.frequency.toLowerCase()} transaction`,
                date: new Date()
            });

            // Saving transaction automatically triggers wallet balance adjustment post-save hook
            await transaction.save();

            transactionsCreated.push({
                recurringId: rule._id,
                transactionId: transaction._id,
                type: rule.type,
                amount: rule.amount,
                category: rule.category,
                walletName: rule.wallet.name
            });

            // Advance nextRunDate based on frequency
            const nextDate = new Date(rule.nextRunDate);
            if (rule.frequency === "DAILY") {
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (rule.frequency === "WEEKLY") {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (rule.frequency === "MONTHLY") {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (rule.frequency === "YEARLY") {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }

            // If advanced date is still in the past (e.g., missed multiple cycles), advance to next future date from today
            while (nextDate <= now) {
                if (rule.frequency === "DAILY") nextDate.setDate(nextDate.getDate() + 1);
                else if (rule.frequency === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7);
                else if (rule.frequency === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);
                else if (rule.frequency === "YEARLY") nextDate.setFullYear(nextDate.getFullYear() + 1);
            }

            rule.nextRunDate = nextDate;
            await rule.save();
        }

        return res.status(200).json({
            message: `Successfully processed ${transactionsCreated.length} recurring transactions!`,
            processedCount: transactionsCreated.length,
            transactionsCreated
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to process recurring transactions.", error: error.message });
    }
};

module.exports = {
    createRecurringTransaction,
    getRecurringTransactions,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    processDueRecurringTransactions
};
