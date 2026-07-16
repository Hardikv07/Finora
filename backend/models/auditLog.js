const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // Optional because some audits happen before login (e.g. FAILED_LOGIN)
    },
    action: {
        type: String,
        required: true,
        enum: [
            "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT",
            "PASSWORD_RESET_REQUEST", "PASSWORD_RESET_SUCCESS",
            "CREATED_TRANSACTION", "DELETED_TRANSACTION",
            "UPDATED_BUDGET", "TRANSFERRED_FUNDS"
        ]
    },
    details: { type: Object, default: {} },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now }
});

// Index by timestamp and user for fast searching in Admin Panel
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ user: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
