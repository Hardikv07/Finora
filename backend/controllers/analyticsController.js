const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");
const Budget = require("../models/budget");
const Rule = require("../models/rule");
const Goal = require("../models/goal");
const sendEmail = require("../utils/sendemail");

/**
 * @desc    Get comprehensive chart data (Pie, Bar, Line, Area) + Anomaly Detection and Insights
 * @route   GET /api/analytics
 * @access  Private
 */
const getAnalyticsCharts = async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const firstDayOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

        // 1. PIE CHART: Spending distribution by category in Current Month
        const pieAgg = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: "EXPENSE",
                    date: { $gte: firstDayOfCurrentMonth }
                }
            },
            {
                $group: {
                    _id: "$category",
                    amount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { amount: -1 } }
        ]);

        const totalCurrentMonthExpense = pieAgg.reduce((acc, curr) => acc + curr.amount, 0);
        const pieChart = pieAgg.map(item => ({
            category: item._id,
            amount: Number(item.amount.toFixed(2)),
            count: item.count,
            percentage: totalCurrentMonthExpense > 0 ? Number(((item.amount / totalCurrentMonthExpense) * 100).toFixed(2)) : 0
        }));

        // 2. BAR CHART: Monthly Income vs Expense (Last 6 Months)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const barAgg = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        type: "$type"
                    },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const barChartMap = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            barChartMap[label] = { month: label, income: 0, expense: 0 };
        }
        barAgg.forEach(item => {
            const label = `${monthNames[item._id.month - 1]} ${item._id.year}`;
            if (barChartMap[label]) {
                if (item._id.type === "INCOME") barChartMap[label].income = Number(item.total.toFixed(2));
                if (item._id.type === "EXPENSE") barChartMap[label].expense = Number(item.total.toFixed(2));
            }
        });
        const barChart = Object.values(barChartMap);

        // 3. LINE CHART: Daily Spending Trend over the last 30 days
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const lineAgg = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: "EXPENSE",
                    date: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        day: { $dayOfMonth: "$date" }
                    },
                    dailyExpense: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        const lineChart = lineAgg.map(item => ({
            date: `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`,
            dailyExpense: Number(item.dailyExpense.toFixed(2))
        }));

        // 4. AREA CHART: Cumulative Net Worth / Net Surplus Growth over last 6 months
        let cumulativeSurplus = 0;
        const areaChart = barChart.map(m => {
            cumulativeSurplus += (m.income - m.expense);
            return {
                month: m.month,
                netSurplusAdded: Number((m.income - m.expense).toFixed(2)),
                cumulativeSurplus: Number(cumulativeSurplus.toFixed(2))
            };
        });

        // 5. INSIGHTS & ANOMALY DETECTION
        const insights = [];
        const anomalies = [];

        // Compare category spending this month vs previous month
        const prevMonthAgg = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: "EXPENSE",
                    date: { $gte: firstDayOfPreviousMonth, $lt: firstDayOfCurrentMonth }
                }
            },
            {
                $group: {
                    _id: "$category",
                    amount: { $sum: "$amount" }
                }
            }
        ]);

        const prevMonthMap = {};
        prevMonthAgg.forEach(item => {
            prevMonthMap[item._id] = item.amount;
        });

        pieChart.forEach(curr => {
            const prevAmount = prevMonthMap[curr.category] || 0;
            if (prevAmount > 0) {
                const diffPercent = Math.round(((curr.amount - prevAmount) / prevAmount) * 100);
                if (diffPercent >= 30) {
                    insights.push(`📊 You spent ${diffPercent}% more on ${curr.category} this month (₹${curr.amount}) compared to last month (₹${prevAmount}).`);
                } else if (diffPercent <= -20) {
                    insights.push(`🎉 Great job! You reduced your ${curr.category} spending by ${Math.abs(diffPercent)}% compared to last month.`);
                }
            }
        });

        if (insights.length === 0 && pieChart.length > 0) {
            insights.push(`📌 Your top spending category this month is ${pieChart[0].category} accounting for ${pieChart[0].percentage}% of total expenses.`);
        }

        // Check for statistical anomalies: single transactions exceeding 3x average transaction amount or > ₹10,000
        const avgExpenseAgg = await Transaction.aggregate([
            { $match: { user: userId, type: "EXPENSE" } },
            { $group: { _id: null, avgAmount: { $avg: "$amount" }, maxAmount: { $max: "$amount" } } }
        ]);

        const avgTransactionAmount = avgExpenseAgg.length > 0 ? avgExpenseAgg[0].avgAmount : 1500;
        const anomalyThreshold = Math.max(5000, avgTransactionAmount * 2.5);

        const recentUnusualTx = await Transaction.find({
            user: userId,
            type: "EXPENSE",
            amount: { $gte: anomalyThreshold }
        }).sort({ date: -1 }).limit(5);

        recentUnusualTx.forEach(tx => {
            anomalies.push({
                transactionId: tx._id,
                amount: tx.amount,
                category: tx.category,
                merchant: tx.merchant || "Unknown Merchant",
                date: tx.date,
                message: `⚠️ Anomaly Alert: Unusual high spending of ₹${tx.amount} on "${tx.category}" (${tx.merchant || "Merchant"}) detected on ${new Date(tx.date).toLocaleDateString()}. Average transaction is around ₹${Math.round(avgTransactionAmount)}.`
            });
        });

        res.status(200).json({
            charts: {
                pieChart,
                barChart,
                lineChart,
                areaChart
            },
            insights,
            anomalies
        });
    } catch (error) {
        console.error("Error generating analytics charts:", error);
        res.status(500).json({ message: "Failed to generate analytics data", error: error.message });
    }
};

/**
 * @desc    Module 11: Smart Search across transactions by keywords, amount ranges, categories, tags, date range, merchant
 * @route   GET /api/search
 * @access  Private
 */
const smartSearch = async (req, res) => {
    try {
        const { query, minAmount, maxAmount, category, merchant, paymentMethod, startDate, endDate, tags, type } = req.query;
        const filter = { user: req.user._id };

        // Keyword text search across merchant, notes, subCategory, or category
        if (query && query.trim() !== "") {
            filter.$or = [
                { merchant: { $regex: query, $options: "i" } },
                { notes: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } },
                { subCategory: { $regex: query, $options: "i" } }
            ];
        }

        // Amount range filter
        if (minAmount || maxAmount) {
            filter.amount = {};
            if (minAmount) filter.amount.$gte = Number(minAmount);
            if (maxAmount) filter.amount.$lte = Number(maxAmount);
        }

        // Category filter
        if (category && category !== "ALL") {
            filter.category = category;
        }

        // Merchant exact or regex filter
        if (merchant) {
            filter.merchant = { $regex: merchant, $options: "i" };
        }

        // Type filter (INCOME / EXPENSE / TRANSFER)
        if (type && type !== "ALL") {
            filter.type = type.toUpperCase();
        }

        // Date range filter
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        // Tags filter (comma separated tags or array)
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim().toLowerCase());
            filter.tags = { $in: tagArray };
        }

        // Execute smart search with populate on wallet
        const results = await Transaction.find(filter)
            .populate("wallet", "name type currency")
            .sort({ date: -1 })
            .limit(100);

        const totalAmountFound = results.reduce((sum, tx) => sum + tx.amount, 0);

        res.status(200).json({
            count: results.length,
            totalAmountFound: Number(totalAmountFound.toFixed(2)),
            searchQueryApplied: req.query,
            results
        });
    } catch (error) {
        console.error("Error performing smart search:", error);
        res.status(500).json({ message: "Smart search execution failed", error: error.message });
    }
};

/**
 * @desc    Module 21: Get all automation rules created by user
 * @route   GET /api/rules
 * @access  Private
 */
const getRules = async (req, res) => {
    try {
        const rules = await Rule.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ count: rules.length, rules });
    } catch (error) {
        console.error("Error fetching rules:", error);
        res.status(500).json({ message: "Failed to fetch rules", error: error.message });
    }
};

/**
 * @desc    Module 21: Create new automation rule (e.g. If Expense > ₹5,000 -> Send Email)
 * @route   POST /api/rules
 * @access  Private
 */
const createRule = async (req, res) => {
    try {
        const { name, triggerType, triggerCondition, actionType, actionPayload } = req.body;
        if (!name || !triggerType || !actionType) {
            return res.status(400).json({ message: "Rule name, triggerType, and actionType are required." });
        }

        const rule = new Rule({
            user: req.user._id,
            name,
            triggerType,
            triggerCondition: triggerCondition || {},
            actionType,
            actionPayload: actionPayload || {}
        });

        await rule.save();
        res.status(201).json({ message: "Automation rule created successfully!", rule });
    } catch (error) {
        console.error("Error creating rule:", error);
        res.status(500).json({ message: "Failed to create rule", error: error.message });
    }
};

/**
 * @desc    Module 21: Delete an automation rule
 * @route   DELETE /api/rules/:id
 * @access  Private
 */
const deleteRule = async (req, res) => {
    try {
        const rule = await Rule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!rule) {
            return res.status(404).json({ message: "Rule not found." });
        }
        res.status(200).json({ message: "Automation rule deleted successfully." });
    } catch (error) {
        console.error("Error deleting rule:", error);
        res.status(500).json({ message: "Failed to delete rule", error: error.message });
    }
};

/**
 * @desc    Module 21: Manually trigger evaluation of all automation rules against latest transactions
 * @route   POST /api/rules/evaluate
 * @access  Private
 */
const evaluateRulesManually = async (req, res) => {
    try {
        const rules = await Rule.find({ user: req.user._id, isActive: true });
        if (!rules || rules.length === 0) {
            return res.status(200).json({ message: "No active automation rules found to evaluate." });
        }

        const triggeredLogs = [];
        const latestTransactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 }).limit(15);

        for (const rule of rules) {
            if (rule.triggerType === "EXPENSE_AMOUNT_ABOVE") {
                const threshold = rule.triggerCondition?.amountThreshold || 5000;
                const matchingTx = latestTransactions.filter(tx => tx.type === "EXPENSE" && tx.amount > threshold);

                if (matchingTx.length > 0) {
                    rule.triggerCount += 1;
                    rule.lastTriggeredAt = new Date();
                    await rule.save();

                    triggeredLogs.push({
                        ruleId: rule._id,
                        ruleName: rule.name,
                        matchedCount: matchingTx.length,
                        actionExecuted: rule.actionType,
                        message: `Rule "${rule.name}" triggered! Found ${matchingTx.length} transaction(s) exceeding ₹${threshold}. Action taken: ${rule.actionType}`
                    });
                }
            } else if (rule.triggerType === "INCOME_CREDITED") {
                const matchingTx = latestTransactions.filter(tx => tx.type === "INCOME");
                if (matchingTx.length > 0) {
                    rule.triggerCount += 1;
                    rule.lastTriggeredAt = new Date();
                    await rule.save();

                    triggeredLogs.push({
                        ruleId: rule._id,
                        ruleName: rule.name,
                        matchedCount: matchingTx.length,
                        actionExecuted: rule.actionType,
                        message: `Rule "${rule.name}" triggered upon detecting recent income credits. Action taken: ${rule.actionType}`
                    });
                }
            }
        }

        res.status(200).json({
            evaluatedRulesCount: rules.length,
            triggeredRulesCount: triggeredLogs.length,
            triggeredLogs
        });
    } catch (error) {
        console.error("Error evaluating rules:", error);
        res.status(500).json({ message: "Rule evaluation failed", error: error.message });
    }
};

module.exports = {
    getAnalyticsCharts,
    smartSearch,
    getRules,
    createRule,
    deleteRule,
    evaluateRulesManually
};
