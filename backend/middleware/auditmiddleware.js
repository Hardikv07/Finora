const AuditLog = require("../models/auditLog");

const logAudit = (actionName) => {
    return async (req, res, next) => {
        const originalJson = res.json;

        res.json = function (body) {
            originalJson.apply(res, arguments);

            if (res.statusCode >= 200 && res.statusCode < 300) {
                setImmediate(async () => {
                    try {
                        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
                        const userAgent = req.headers["user-agent"] || "Unknown Device";

                        await AuditLog.create({
                            user: req.user?._id || null,
                            action: actionName,
                            details: {
                                method: req.method,
                                url: req.originalUrl,
                                bodyKeys: Object.keys(req.body || {})
                            },
                            ipAddress: ip,
                            userAgent: userAgent
                        });
                    } catch (err) {
                        console.error("Audit Logging Error:", err.message);
                    }
                });
            }
        };

        next();
    };
};

module.exports = logAudit;
