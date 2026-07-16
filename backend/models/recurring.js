const mongoose = require("mongoose");

const recurringSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Recurring transaction must belong to a user"],
        index: true
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        required: [true, "Wallet is required for recurring transaction execution"]
    },
    type: {
        type: String,
        enum: ["INCOME", "EXPENSE", "TRANSFER"],
        required: true
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0.01, "Amount must be greater than zero"]
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        trim: true
    },
    subCategory: {
        type: String,
        trim: true
    },
    frequency: {
        type: String,
        enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
        required: [true, "Frequency schedule is required"]
    },
    nextRunDate: {
        type: Date,
        required: [true, "Next execution date is required"],
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Compound index for finding due transactions quickly during cron/manual processing
recurringSchema.index({ isActive: 1, nextRunDate: 1 });
recurringSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model("RecurringTransaction", recurringSchema);
