const mongoose = require("mongoose");

const ruleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Rule must belong to a user"],
        index: true
    },
    name: {
        type: String,
        required: [true, "Rule name is required (e.g., 'Alert if single expense > ₹5,000', 'Auto-save 20% of salary')"],
        trim: true
    },
    triggerType: {
        type: String,
        enum: [
            "EXPENSE_AMOUNT_ABOVE",
            "INCOME_CREDITED",
            "CATEGORY_SPEND_ABOVE",
            "WALLET_BALANCE_BELOW"
        ],
        required: [true, "Trigger condition type is required"]
    },
    triggerCondition: {
        amountThreshold: { type: Number, default: 0 },
        category: { type: String, trim: true },
        walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" }
    },
    actionType: {
        type: String,
        enum: [
            "SEND_EMAIL_ALERT",
            "AUTO_CONTRIBUTE_GOAL",
            "LOG_ANOMALY"
        ],
        required: [true, "Action execution type is required"]
    },
    actionPayload: {
        targetGoalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal" },
        allocationPercentage: { type: Number, default: 0 }, // e.g. 20 for 20%
        customMessage: { type: String, trim: true }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastTriggeredAt: {
        type: Date
    },
    triggerCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Compound index for super fast evaluation during transaction creation hooks
ruleSchema.index({ user: 1, isActive: 1, triggerType: 1 });

module.exports = mongoose.model("Rule", ruleSchema);
