const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Budget must belong to a user"],
        index: true
    },
    category: {
        type: String,
        trim: true,
        default: null // If null or empty string, represents Total Monthly/Weekly overall budget
    },
    amountLimit: {
        type: Number,
        required: [true, "Budget amount limit is required"],
        min: [0, "Amount limit must be greater than or equal to zero"]
    },
    period: {
        type: String,
        enum: ["MONTHLY", "WEEKLY", "CUSTOM"],
        default: "MONTHLY"
    },
    startDate: {
        type: Date,
        required: [true, "Budget start date is required"]
    },
    endDate: {
        type: Date,
        required: [true, "Budget end date is required"]
    },
    alertThreshold: {
        type: Number,
        default: 80, // Trigger warning alert at 80% of amount limit
        min: [1, "Alert threshold must be at least 1%"],
        max: [100, "Alert threshold cannot exceed 100%"]
    },
    carryForward: {
        type: Boolean,
        default: false // Whether remaining budget carries over to next month
    }
}, { timestamps: true });

// Compound indexes for lightning-fast range checks and filtering
budgetSchema.index({ user: 1, category: 1, startDate: 1, endDate: 1 });
budgetSchema.index({ user: 1, startDate: -1 });

module.exports = mongoose.model("Budget", budgetSchema);
