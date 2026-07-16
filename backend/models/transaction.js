const mongoose = require("mongoose");
 
const splitSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String }, // For non-registered friends/contacts
    amount: { type: Number, required: true },
    paid: { type: Boolean, default: false }
}, { _id: true });
 
const transactionSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true 
    },
    wallet: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Wallet", 
        required: [true, "Transaction must be linked to a wallet"],
        index: true 
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
    currency: { 
        type: String, 
        enum: ["INR", "USD", "EUR", "GBP"], 
        default: "INR" 
    },
    category: { 
        type: String, 
        required: [true, "Category is required (e.g., Salary, Food, Rent, Travel)"],
        trim: true
    },
    subCategory: { 
        type: String, 
        trim: true 
    },
    tags: [{ 
        type: String, 
        trim: true,
        lowercase: true 
    }],
    merchant: { 
        type: String, 
        trim: true // e.g., 'Swiggy', 'Amazon', 'Apple Store'
    },
    receiptUrl: { 
        type: String // Cloudinary secure URL for uploaded bill/invoice PDF or image
    },
    receiptPublicId: { 
        type: String // Cloudinary public_id for deleting/replacing images later
    },
    splitWith: [splitSchema],
    taxIncluded: { 
        type: Boolean, 
        default: false 
    },
    taxRate: { 
        type: Number, 
        default: 0 // e.g., 18 for 18% GST
    },
    taxAmount: { 
        type: Number, 
        default: 0 
    },
    date: { 
        type: Date, 
        default: Date.now,
        index: true 
    },
    notes: { 
        type: String, 
        trim: true 
    }
}, { timestamps: true });
 
// Compound indexes for lightning-fast dashboard queries & sorting
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ wallet: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
 
// Pre-save calculation for tax Amount if taxRate is provided
transactionSchema.pre("save", function(next) {
    if (this.taxIncluded && this.taxRate > 0 && !this.taxAmount) {
        // Calculate tax component extracted from inclusive amount
        this.taxAmount = Number(((this.amount * this.taxRate) / (100 + this.taxRate)).toFixed(2));
    } else if (!this.taxIncluded && this.taxRate > 0 && !this.taxAmount) {
        // Calculate tax added on top of base amount
        this.taxAmount = Number(((this.amount * this.taxRate) / 100).toFixed(2));
    }
    next();
});


const Wallet = require("./wallet");
 
// 1. POST-SAVE HOOK: Triggered whenever a new Transaction is saved
transactionSchema.post("save", async function(doc, next) {
    try {
        // Only adjust wallet automatically if this is a newly created transaction
        // (For edits/updates, we handle delta calculation via explicit controller sync or recalculate function)
        if (doc.$isNew) {
            const adjustment = doc.type === "INCOME" ? doc.amount : 
                               doc.type === "EXPENSE" ? -doc.amount : 0;
            
            if (adjustment !== 0) {
                await Wallet.findByIdAndUpdate(doc.wallet, {
                    $inc: { balance: adjustment }
                });
            }
        }
        next();
    } catch (error) {
        console.error("Error updating wallet balance in post-save hook:", error);
        next(error);
    }
});
 
// 2. POST-DELETE HOOK: Triggered whenever Transaction.findOneAndDelete() or deleteOne() is executed
transactionSchema.post("findOneAndDelete", async function(doc, next) {
    if (!doc) return next(); // Document was not found
    try {
        // REVERSE THE EFFECT OF THE DELETED TRANSACTION:
        // If an Expense of ₹1,000 is deleted -> Add ₹1,000 back to Wallet (+amount)
        // If an Income of ₹2,000 is deleted -> Deduct ₹2,000 from Wallet (-amount)
        const reverseAdjustment = doc.type === "INCOME" ? -doc.amount : 
                                  doc.type === "EXPENSE" ? doc.amount : 0;
        
        if (reverseAdjustment !== 0) {
            await Wallet.findByIdAndUpdate(doc.wallet, {
                $inc: { balance: reverseAdjustment }
            });
        }
        next();
    } catch (error) {
        console.error("Error reverting wallet balance in post-delete hook:", error);
        next(error);
    }
});

 
module.exports = mongoose.model("Transaction", transactionSchema);
