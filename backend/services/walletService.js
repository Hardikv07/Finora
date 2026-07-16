
const mongoose = require("mongoose");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");
 
/**
 * @desc    Recalculate exact Wallet balance from source transaction records
 * @param   {String|ObjectId} walletId 
 * @param   {Number} initialBalance - Opening balance before any transactions (default 0)
 * @returns {Promise<Number>} Exactly synced wallet balance
 */
const recalculateWalletBalance = async (walletId, initialBalance = 0) => {
    try {
        const stats = await Transaction.aggregate([
            { $match: { wallet: new mongoose.Types.ObjectId(walletId) } },
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);
 
        let totalIncome = 0;
        let totalExpense = 0;
 
        stats.forEach(stat => {
            if (stat._id === "INCOME") totalIncome = stat.totalAmount;
            if (stat._id === "EXPENSE") totalExpense = stat.totalAmount;
        });
 
        const exactSyncedBalance = Number((initialBalance + totalIncome - totalExpense).toFixed(2));
 
        // Update wallet with exact calculated balance
        await Wallet.findByIdAndUpdate(walletId, {
            $set: { balance: exactSyncedBalance }
        });
 
        console.log("[Wallet Sync] Wallet " + walletId + " balance synced to ₹" + exactSyncedBalance);
        return exactSyncedBalance;
    } catch (error) {
        console.error("[Wallet Sync Error] Failed to sync wallet " + walletId + ":", error);
        throw error;
    }
};
 
module.exports = { recalculateWalletBalance };
