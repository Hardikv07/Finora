const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isverified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    // 1. Refresh Tokens (Allow multiple devices)
    refreshTokens: [{
        token: { type: String },
        device: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],

    // 2. Email Verification / Two-Factor OTP
    otpCode: { type: String },
    otpExpire: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },

    // 3. Secure Password Reset Tokens (Store SHA-256 hashes, not plain tokens!)
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    // 4. Active Sessions Tracking (For Device Management dashboard)
    activeSessions: [{
        sessionId: { type: String },
        ip: { type: String },
        userAgent: { type: String },
        lastActive: { type: Date, default: Date.now }
    }],


    createdAt: {
        type: Date,
        default: Date.now
    },

}, { timestamps: true });


userSchema.pre("save", async function() {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};



module.exports = mongoose.model("User", userSchema)


