const User = require("../models/user");
const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");
const Budget = require("../models/budget");
const Goal = require("../models/goal");
const Loan = require("../models/loan");
const Investment = require("../models/investment");
const Bill = require("../models/bill");
const AuditLog = require("../models/auditLog");

/**
 * @desc    Module 15: Get Admin Panel system overview & metrics
 * @route   GET /api/admin/overview
 * @access  Private (Admin only or protected)
 */
const getAdminOverview = async (req, res) => {
    try {
        const totalUsersCount = await User.countDocuments();
        const totalTransactionsCount = await Transaction.countDocuments();
        const totalWalletsCount = await Wallet.countDocuments();
        const totalBudgetsCount = await Budget.countDocuments();
        const totalGoalsCount = await Goal.countDocuments();
        const totalLoansCount = await Loan.countDocuments();
        const totalInvestmentsCount = await Investment.countDocuments();
        const totalBillsCount = await Bill.countDocuments();

        // Calculate total financial volume processed across entire SaaS platform
        const volumeAgg = await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalVolume: { $sum: "$amount" }
                }
            }
        ]);
        const totalPlatformVolume = volumeAgg.length > 0 ? Number(volumeAgg[0].totalVolume.toFixed(2)) : 0;

        // Recent users registered
        const recentUsers = await User.find().select("-password").sort({ createdAt: -1 }).limit(6);

        // Recent system audit logs
        const recentAuditLogs = await AuditLog.find()
            .populate("user", "name email")
            .sort({ timestamp: -1 })
            .limit(10);

        res.status(200).json({
            platformMetrics: {
                totalUsersCount,
                totalTransactionsCount,
                totalWalletsCount,
                totalBudgetsCount,
                totalGoalsCount,
                totalLoansCount,
                totalInvestmentsCount,
                totalBillsCount,
                totalPlatformVolume,
                systemUptimeSeconds: process.uptime(),
                serverStatus: "HEALTHY"
            },
            recentUsers,
            recentAuditLogs
        });
    } catch (error) {
        console.error("Error fetching admin overview:", error);
        res.status(500).json({ message: "Failed to fetch admin overview", error: error.message });
    }
};

/**
 * @desc    Module 15: Get list of all users with search and filter
 * @route   GET /api/admin/users
 * @access  Private (Admin/Protected)
 */
const getUsersList = async (req, res) => {
    try {
        const { search, role, isBlocked } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }
        if (role && role !== "ALL") {
            filter.role = role;
        }
        if (isBlocked !== undefined && isBlocked !== "ALL") {
            filter.isBlocked = isBlocked === "true";
        }

        const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
        res.status(200).json({ count: users.length, users });
    } catch (error) {
        console.error("Error fetching users list:", error);
        res.status(500).json({ message: "Failed to retrieve users", error: error.message });
    }
};

/**
 * @desc    Module 15: Block or unblock a user
 * @route   PUT /api/admin/users/:id/block
 * @access  Private
 */
const toggleBlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.isBlocked = !user.isBlocked;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            message: `User "${user.name}" has been ${user.isBlocked ? "BLOCKED" : "UNBLOCKED"} successfully.`,
            user
        });
    } catch (error) {
        console.error("Error toggling block user:", error);
        res.status(500).json({ message: "Failed to update user block status", error: error.message });
    }
};

/**
 * @desc    Module 16: Retrieve paginated and filterable system Audit Logs
 * @route   GET /api/admin/audit-logs
 * @access  Private
 */
const getAuditLogs = async (req, res) => {
    try {
        const { action, userId, limit = 50 } = req.query;
        const filter = {};

        if (action && action !== "ALL") {
            filter.action = action;
        }
        if (userId) {
            filter.user = userId;
        }

        const logs = await AuditLog.find(filter)
            .populate("user", "name email role")
            .sort({ timestamp: -1 })
            .limit(Number(limit));

        res.status(200).json({ count: logs.length, logs });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ message: "Failed to fetch audit logs", error: error.message });
    }
};

/**
 * @desc    Module 17: Get Activity Timeline for current user (Unified chronological stream across all actions)
 * @route   GET /api/admin/timeline (and /api/timeline)
 * @access  Private
 */
const getActivityTimeline = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch user's audit logs specifically representing high-level milestones and changes
        const timelineLogs = await AuditLog.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(40);

        // Also fetch latest transactions, budgets, goals created to synthesize any missing timeline events
        const recentTx = await Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(10);
        const recentGoals = await Goal.find({ user: userId }).sort({ createdAt: -1 }).limit(5);
        const recentLoans = await Loan.find({ user: userId }).sort({ createdAt: -1 }).limit(5);

        const synthesizedTimeline = [];

        timelineLogs.forEach(log => {
            synthesizedTimeline.push({
                id: log._id,
                eventType: log.action,
                title: log.action.replace(/_/g, " "),
                description: `Executed ${log.action.replace(/_/g, " ").toLowerCase()}`,
                details: log.details,
                timestamp: log.timestamp
            });
        });

        // Add recent transactions to timeline if not duplicate
        recentTx.forEach(tx => {
            synthesizedTimeline.push({
                id: `tx_${tx._id}`,
                eventType: `TRANSACTION_${tx.type}`,
                title: `${tx.type === "INCOME" ? "Added Income" : tx.type === "EXPENSE" ? "Added Expense" : "Transfer Funds"}: ₹${tx.amount}`,
                description: `Category: ${tx.category}${tx.merchant ? ` at ${tx.merchant}` : ""}`,
                details: { amount: tx.amount, category: tx.category, notes: tx.notes },
                timestamp: tx.createdAt || tx.date
            });
        });

        // Sort unified timeline by timestamp descending
        synthesizedTimeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.status(200).json({
            count: synthesizedTimeline.length,
            timeline: synthesizedTimeline
        });
    } catch (error) {
        console.error("Error generating activity timeline:", error);
        res.status(500).json({ message: "Failed to generate activity timeline", error: error.message });
    }
};

module.exports = {
    getAdminOverview,
    getUsersList,
    toggleBlockUser,
    getAuditLogs,
    getActivityTimeline
};
