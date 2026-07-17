const mongoose = require("mongoose");

const billPaymentRecordSchema = new mongoose.Schema({
    paidOn: { type: Date, default: Date.now },
    amountPaid: { type: Number, required: true },
    walletUsed: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    receiptUrl: { type: String }
});

const billSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Bill must belong to a user"],
        index: true
    },
    title: {
        type: String,
        required: [true, "Bill title is required (e.g., Tata Power Electricity, Jio Broadband, Apartment Rent)"],
        trim: true
    },
    category: {
        type: String,
        enum: ["Electricity", "Internet", "Rent", "Mobile", "Credit Card", "Water", "Gas", "Insurance", "Subscription", "Other"],
        required: [true, "Bill category is required"],
        default: "Electricity"
    },
    billerNameOrProvider: {
        type: String,
        trim: true // e.g., Tata Power, Airtel, HDFC Credit Card
    },
    amount: {
        type: Number,
        required: [true, "Bill amount is required"],
        min: [0.01, "Amount must be greater than zero"]
    },
    dueDate: {
        type: Date,
        required: [true, "Bill due date is required"],
        index: true
    },
    autoReminder: {
        type: Boolean,
        default: true // Whether to send email/push reminder when due date approaches
    },
    repeatMonthly: {
        type: Boolean,
        default: false // Whether this bill automatically renews for the next month once paid
    },
    status: {
        type: String,
        enum: ["PENDING", "PAID", "OVERDUE"],
        default: "PENDING",
        index: true
    },
    attachedInvoiceUrl: {
        type: String // Cloudinary secure URL for bill PDF/image upload
    },
    attachedInvoicePublicId: {
        type: String // Cloudinary public_id for cleanup
    },
    paymentHistory: [billPaymentRecordSchema],
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Compound index for finding pending/overdue bills due within date ranges
billSchema.index({ user: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model("Bill", billSchema);
