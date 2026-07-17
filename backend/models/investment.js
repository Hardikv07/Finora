const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Investment must belong to a user"],
        index: true
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        required: false // Optional linked wallet from which investment funds were debited or dividends credited
    },
    name: {
        type: String,
        required: [true, "Investment asset name is required (e.g., Apple Inc, HDFC Top 100 Mutual Fund, Bitcoin, SGB Gold)"],
        trim: true
    },
    symbolOrTicker: {
        type: String,
        trim: true,
        uppercase: true // e.g., AAPL, BTC, HDFCMF
    },
    assetType: {
        type: String,
        enum: ["Stocks", "Mutual Funds", "Gold", "Crypto", "FD", "Bonds", "SIP", "Other"],
        required: [true, "Asset type is required"],
        default: "Stocks"
    },
    investedAmount: {
        type: Number,
        required: [true, "Total invested principal amount is required"],
        min: [0, "Invested amount cannot be negative"]
    },
    currentValue: {
        type: Number,
        required: [true, "Current market value is required"],
        min: [0, "Current value cannot be negative"]
    },
    quantity: {
        type: Number,
        default: 1,
        min: [0.000001, "Quantity must be greater than zero"]
    },
    purchasePricePerUnit: {
        type: Number,
        default: 0
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    currency: {
        type: String,
        enum: ["INR", "USD", "EUR", "GBP"],
        default: "INR"
    },
    isSIP: {
        type: Boolean,
        default: false // Whether this is a Systematic Investment Plan (SIP)
    },
    sipMonthlyAmount: {
        type: Number,
        default: 0
    },
    sipNextDueDate: {
        type: Date
    },
    interestRateOrExpectedCAGR: {
        type: Number,
        default: 0 // e.g. 7.5% for Fixed Deposit (FD) or 12% for Mutual Fund
    },
    maturityDate: {
        type: Date // For FDs or Bonds
    },
    dividendsReceived: {
        type: Number,
        default: 0 // Cumulative dividend payout received so far
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Virtual fields for ROI (%) and Absolute Profit/Loss (₹/$)
investmentSchema.virtual("profitOrLoss").get(function() {
    return Number((this.currentValue - this.investedAmount + (this.dividendsReceived || 0)).toFixed(2));
});

investmentSchema.virtual("roiPercentage").get(function() {
    if (!this.investedAmount || this.investedAmount === 0) return 0;
    const netReturn = this.currentValue - this.investedAmount + (this.dividendsReceived || 0);
    return Number(((netReturn / this.investedAmount) * 100).toFixed(2));
});

// Enable virtuals in JSON outputs
investmentSchema.set("toJSON", { virtuals: true });
investmentSchema.set("toObject", { virtuals: true });

// Indexing for fast portfolio filtering and asset allocation queries
investmentSchema.index({ user: 1, assetType: 1 });
investmentSchema.index({ user: 1, isSIP: 1 });

module.exports = mongoose.model("Investment", investmentSchema);
