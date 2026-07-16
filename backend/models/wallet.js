const mongoose = require("mongoose");
 
const walletSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true
    },
    name: { 
        type: String, 
        required: [true, "Wallet name is required (e.g., 'HDFC Savings', 'Paytm Wallet')"],
        trim: true
    },
    type: { 
        type: String, 
        enum: ["Cash", "Bank", "Credit Card", "Paytm", "PhonePe", "Google Pay", "Other"], 
        required: [true, "Wallet type is required"],
        default: "Bank"
    },
    balance: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    currency: { 
        type: String, 
        enum: ["INR", "USD", "EUR", "GBP"], 
        default: "INR",
        uppercase: true
    },
    accountNumber: { 
        type: String, 
        trim: true,
        maxlength: 20 // Store last 4 digits or masked identifier for security
    },
    isDefault: { 
        type: Boolean, 
        default: false 
    },
    color: { 
        type: String, 
        default: "#1a3c5e" // Hex color code for custom UI card branding
    }
}, { timestamps: true });
 
// Prevent duplicate wallet names for the same user (e.g., two 'HDFC Bank' wallets)
walletSchema.index({ user: 1, name: 1 }, { unique: true });
 
// Ensure only ONE default wallet per user when setting isDefault: true
walletSchema.pre("save", async function(next) {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
    next();
});
 
module.exports = mongoose.model("Wallet", walletSchema);
