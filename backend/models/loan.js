const mongoose = require("mongoose");

const loanPaymentHistorySchema = new mongoose.Schema({
    paymentDate: { type: Date, default: Date.now },
    amountPaid: { type: Number, required: true },
    principalComponent: { type: Number, required: true },
    interestComponent: { type: Number, required: true },
    notes: { type: String, trim: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }
});

const loanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Loan must belong to a user"],
        index: true
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        required: false // Optional default wallet from which monthly EMI payments are deducted
    },
    loanName: {
        type: String,
        required: [true, "Loan name is required (e.g., SBI Home Loan, HDFC Car Loan)"],
        trim: true
    },
    loanType: {
        type: String,
        enum: ["Home Loan", "Car Loan", "Personal Loan", "Education Loan", "Mortgage", "Other"],
        required: [true, "Loan type is required"],
        default: "Personal Loan"
    },
    lenderName: {
        type: String,
        trim: true // e.g., SBI, HDFC Bank, ICICI Bank
    },
    principalAmount: {
        type: Number,
        required: [true, "Total loan principal amount is required"],
        min: [1, "Principal amount must be greater than zero"]
    },
    remainingBalance: {
        type: Number,
        required: true,
        min: [0, "Remaining balance cannot be negative"]
    },
    interestRatePerAnnum: {
        type: Number,
        required: [true, "Annual interest rate percentage is required"],
        min: [0, "Interest rate cannot be negative"]
    },
    tenureMonths: {
        type: Number,
        required: [true, "Total tenure in months is required"],
        min: [1, "Tenure must be at least 1 month"]
    },
    monthlyEmi: {
        type: Number,
        required: true,
        min: [0, "Monthly EMI cannot be negative"]
    },
    startDate: {
        type: Date,
        required: [true, "Loan start date is required"],
        default: Date.now
    },
    nextDueDate: {
        type: Date,
        required: [true, "Next EMI due date is required"],
        index: true
    },
    dueAlertsEnabled: {
        type: Boolean,
        default: true
    },
    totalInterestPaidSoFar: {
        type: Number,
        default: 0
    },
    totalPrincipalPaidSoFar: {
        type: Number,
        default: 0
    },
    isClosed: {
        type: Boolean,
        default: false
    },
    paymentHistory: [loanPaymentHistorySchema],
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Pre-save calculation helper for remaining balance checking
loanSchema.pre("save", function(next) {
    if (this.remainingBalance <= 0) {
        this.remainingBalance = 0;
        this.isClosed = true;
    }
    next();
});

// Index for fast query of upcoming EMI due alerts
loanSchema.index({ user: 1, isClosed: 1, nextDueDate: 1 });

module.exports = mongoose.model("Loan", loanSchema);
