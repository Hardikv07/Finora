const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Goal must belong to a user"],
        index: true
    },
    title: {
        type: String,
        required: [true, "Goal title is required (e.g., Buy Car, Emergency Fund)"],
        trim: true
    },
    targetAmount: {
        type: Number,
        required: [true, "Target amount is required"],
        min: [1, "Target amount must be greater than zero"]
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: [0, "Current amount cannot be negative"]
    },
    deadline: {
        type: Date,
        required: [true, "Goal target deadline is required"]
    },
    priority: {
        type: String,
        enum: ["High", "Med", "Low"],
        default: "Med"
    },
    autoContributePercent: {
        type: Number,
        default: 0, // e.g., 10 for automatically allocating 10% of any incoming Salary/Income
        min: [0, "Contribution percentage cannot be negative"],
        max: [100, "Contribution percentage cannot exceed 100%"]
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Compound index for dashboard queries and auto-contribution evaluation
goalSchema.index({ user: 1, isCompleted: 1, priority: 1 });

module.exports = mongoose.model("Goal", goalSchema);
