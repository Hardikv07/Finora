const mongoose = require("mongoose");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");
 
/**
 * @desc    Create new wallet for the logged-in user
 * @route   POST /api/wallets
 * @access  Private
 */
const createWallet = async (req, res) => {
    try {
        const { name, type, balance = 0, currency = "INR", accountNumber, isDefault = false, color } = req.body;

        if (!name || !type) {
            return res.status(400).json({ message: "Wallet name and type are required." });
        }

        // Check for duplicate name for this user
        const existingWallet = await Wallet.findOne({ user: req.user._id, name: name.trim() });
        if (existingWallet) {
            return res.status(400).json({ message: `You already have a wallet named '${name}'. Please choose a unique name.` });
        }

        const wallet = new Wallet({
            user: req.user._id,
            name: name.trim(),
            type,
            balance: Number(balance),
            currency: currency.toUpperCase(),
            accountNumber: accountNumber ? accountNumber.trim() : undefined,
            isDefault: Boolean(isDefault),
            color: color || "#1a3c5e"
        });

        await wallet.save();

        return res.status(201).json({
            message: "Wallet created successfully!",
            wallet
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A wallet with this name already exists." });
        }
        return res.status(500).json({ message: "Failed to create wallet.", error: error.message });
    }
};

/**
 * @desc    Get all wallets for the logged-in user
 * @route   GET /api/wallets
 * @access  Private
 */
const getWallets = async (req, res) => {
    try {
        const wallets = await Wallet.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
        const totalBalance = wallets.reduce((acc, curr) => acc + (curr.balance || 0), 0);

        return res.status(200).json({
            wallets,
            totalBalance: Number(totalBalance.toFixed(2)),
            count: wallets.length
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch wallets.", error: error.message });
    }
};

/**
 * @desc    Get single wallet by ID
 * @route   GET /api/wallets/:id
 * @access  Private
 */
const getWalletById = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user._id });
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found or unauthorized." });
        }
        return res.status(200).json({ wallet });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch wallet details.", error: error.message });
    }
};

/**
 * @desc    Update wallet details
 * @route   PUT /api/wallets/:id
 * @access  Private
 */
const updateWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user._id });
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found or unauthorized." });
        }

        const { name, type, currency, accountNumber, isDefault, color } = req.body;

        if (name && name.trim() !== wallet.name) {
            const duplicate = await Wallet.findOne({ user: req.user._id, name: name.trim(), _id: { $ne: wallet._id } });
            if (duplicate) {
                return res.status(400).json({ message: `A wallet named '${name}' already exists.` });
            }
            wallet.name = name.trim();
        }

        if (type) wallet.type = type;
        if (currency) wallet.currency = currency.toUpperCase();
        if (accountNumber !== undefined) wallet.accountNumber = accountNumber;
        if (isDefault !== undefined) wallet.isDefault = Boolean(isDefault);
        if (color) wallet.color = color;

        await wallet.save();

        return res.status(200).json({
            message: "Wallet updated successfully!",
            wallet
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update wallet.", error: error.message });
    }
};

/**
 * @desc    Delete wallet
 * @route   DELETE /api/wallets/:id
 * @access  Private
 */
const deleteWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user._id });
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found or unauthorized." });
        }

        // Check if there are transactions attached to this wallet
        const transactionCount = await Transaction.countDocuments({ wallet: wallet._id });
        if (transactionCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete wallet because it has ${transactionCount} associated transaction(s). Please delete or move the transactions first.` 
            });
        }

        await Wallet.deleteOne({ _id: wallet._id });

        return res.status(200).json({
            message: "Wallet deleted successfully."
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete wallet.", error: error.message });
    }
};

/**
 * @desc    Transfer funds between two wallets atomically using ACID transaction
 * @route   POST /api/wallets/transfer
 * @access  Private
 */
const transferFunds = async (req, res) => {
    const { fromWalletId, toWalletId, amount, notes, date } = req.body;
 
    if (!fromWalletId || !toWalletId || !amount) {
        return res.status(400).json({ message: "Please provide source wallet, destination wallet, and amount." });
    }
    if (fromWalletId === toWalletId) {
        return res.status(400).json({ message: "Cannot transfer funds to the exact same wallet." });
    }
    if (amount <= 0) {
        return res.status(400).json({ message: "Transfer amount must be greater than zero." });
    }
 
    // 1. Initialize Mongoose Session & Start Transaction
    const session = await mongoose.startSession();
    session.startTransaction();
 
    try {
        // 2. Fetch both wallets WITHIN the session
        const fromWallet = await Wallet.findOne({ _id: fromWalletId, user: req.user._id }).session(session);
        const toWallet = await Wallet.findOne({ _id: toWalletId, user: req.user._id }).session(session);
 
        if (!fromWallet || !toWallet) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "One or both wallets not found or unauthorized." });
        }
 
        // 3. Check sufficient balance (Allow negative balance for Credit Cards only)
        if (fromWallet.type !== "Credit Card" && fromWallet.balance < amount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                message: "Insufficient funds in " + fromWallet.name + ". Current balance: ₹" + fromWallet.balance 
            });
        }
 
        // 4. Perform Atomic Updates
        fromWallet.balance -= amount;
        toWallet.balance += amount;
 
        await fromWallet.save({ session });
        await toWallet.save({ session });
 
        // 5. Create audit transaction records for both sides of the transfer
        const transferOut = new Transaction({
            user: req.user._id,
            wallet: fromWallet._id,
            type: "TRANSFER",
            amount: amount,
            currency: fromWallet.currency,
            category: "Transfer Out",
            merchant: toWallet.name,
            notes: notes || ("Transfer to " + toWallet.name),
            date: date || new Date()
        });
 
        const transferIn = new Transaction({
            user: req.user._id,
            wallet: toWallet._id,
            type: "TRANSFER",
            amount: amount,
            currency: toWallet.currency,
            category: "Transfer In",
            merchant: fromWallet.name,
            notes: notes || ("Transfer from " + fromWallet.name),
            date: date || new Date()
        });
 
        await transferOut.save({ session });
        await transferIn.save({ session });
 
        // 6. Commit transaction if all steps succeeded
        await session.commitTransaction();
        session.endSession();
 
        return res.status(200).json({
            message: "Successfully transferred ₹" + amount + " from " + fromWallet.name + " to " + toWallet.name + ".",
            fromWallet: { id: fromWallet._id, name: fromWallet.name, newBalance: fromWallet.balance },
            toWallet: { id: toWallet._id, name: toWallet.name, newBalance: toWallet.balance }
        });
 
    } catch (error) {
        // Rollback all database modifications if any unexpected exception occurred
        await session.abortTransaction();
        session.endSession();
        console.error("Transfer transaction failed:", error);
        return res.status(500).json({ message: "Transfer failed due to a server or transaction error.", error: error.message });
    }
};
 
module.exports = { 
    createWallet,
    getWallets,
    getWalletById,
    updateWallet,
    deleteWallet,
    transferFunds 
};
