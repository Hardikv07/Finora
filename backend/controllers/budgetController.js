const Budget = require("../models/budget");
const Transaction = require("../models/transaction");

/**
 * @desc    Create new budget (Monthly, Weekly, or Custom)
 * @route   POST /api/budgets
 * @access  Private
 */
const createBudget = async (req, res) => {
    try {
        const { category, amountLimit, period = "MONTHLY", startDate, endDate, alertThreshold = 80, carryForward = false } = req.body;

        if (!amountLimit || Number(amountLimit) < 0) {
            return res.status(400).json({ message: "Valid amountLimit is required." });
        }

        let start = startDate ? new Date(startDate) : new Date();
        let end = endDate ? new Date(endDate) : new Date();

        if (!startDate || !endDate) {
            const now = new Date();
            if (period.toUpperCase() === "MONTHLY") {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            } else if (period.toUpperCase() === "WEEKLY") {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
                start = new Date(now.setDate(diff));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
            }
        }

        const budget = new Budget({
            user: req.user._id,
            category: category ? category.trim() : null,
            amountLimit: Number(amountLimit),
            period: period.toUpperCase(),
            startDate: start,
            endDate: end,
            alertThreshold: Number(alertThreshold),
            carryForward: Boolean(carryForward)
        });

        await budget.save();

        return res.status(201).json({
            message: "Budget created successfully!",
            budget
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to create budget.", error: error.message });
    }
};

/**
 * @desc    Get all user budgets with real-time spent calculation
 * @route   GET /api/budgets
 * @access  Private
 */
const getBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find({ user: req.user._id }).sort({ startDate: -1 });

        // Enrich each budget with real-time totalSpent from Transactions
        const enrichedBudgets = await Promise.all(budgets.map(async (budget) => {
            const matchQuery = {
                user: budget.user,
                type: "EXPENSE",
                date: { $gte: budget.startDate, $lte: budget.endDate }
            };

            if (budget.category && budget.category.trim() !== "" && budget.category !== "ALL") {
                matchQuery.category = budget.category;
            }

            const aggregation = await Transaction.aggregate([
                { $match: matchQuery },
                { $group: { _id: null, totalSpent: { $sum: "$amount" } } }
            ]);

            const totalSpent = aggregation.length > 0 ? aggregation[0].totalSpent : 0;
            const remaining = Number(Math.max(0, budget.amountLimit - totalSpent).toFixed(2));
            const percentageUsed = Math.round((totalSpent / budget.amountLimit) * 100);

            return {
                ...budget.toObject(),
                totalSpent: Number(totalSpent.toFixed(2)),
                remaining,
                percentageUsed,
                isAlertTriggered: percentageUsed >= budget.alertThreshold
            };
        }));

        return res.status(200).json({ budgets: enrichedBudgets });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch budgets.", error: error.message });
    }
};

/**
 * @desc    Update budget properties and thresholds
 * @route   PUT /api/budgets/:id
 * @access  Private
 */
const updateBudget = async (req, res) => {
    try {
        const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
        if (!budget) {
            return res.status(404).json({ message: "Budget not found." });
        }

        Object.assign(budget, req.body);
        if (req.body.amountLimit) budget.amountLimit = Number(req.body.amountLimit);
        if (req.body.alertThreshold) budget.alertThreshold = Number(req.body.alertThreshold);

        await budget.save();

        return res.status(200).json({
            message: "Budget updated successfully!",
            budget
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update budget.", error: error.message });
    }
};

/**
 * @desc    Delete budget
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
const deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!budget) {
            return res.status(404).json({ message: "Budget not found." });
        }

        return res.status(200).json({ message: "Budget deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete budget.", error: error.message });
    }
};

/**
 * @desc    DIY Learning Challenge: Budget Carry Forward / Rollover
 *          If Month 1 budget is ₹50,000 and spent ₹42,000, remaining ₹8,000 rolls over to Month 2 (amountLimit + remaining)
 * @route   POST /api/budgets/rollover
 * @access  Private
 */
const rolloverBudget = async (req, res) => {
    try {
        const { budgetId } = req.body;

        let query = { user: req.user._id, carryForward: true };
        if (budgetId) {
            query._id = budgetId;
        } else {
            // If no budgetId specified, pick past budgets whose endDate has passed or end of month
            query.endDate = { $lte: new Date() };
        }

        const budgetsToRollover = await Budget.find(query);

        if (!budgetsToRollover || budgetsToRollover.length === 0) {
            return res.status(404).json({ message: "No eligible budgets found with carryForward enabled." });
        }

        const rolloverResults = [];

        for (const prevBudget of budgetsToRollover) {
            // 1. Calculate actual spent in Month 1
            const matchQuery = {
                user: prevBudget.user,
                type: "EXPENSE",
                date: { $gte: prevBudget.startDate, $lte: prevBudget.endDate }
            };

            if (prevBudget.category && prevBudget.category.trim() !== "" && prevBudget.category !== "ALL") {
                matchQuery.category = prevBudget.category;
            }

            const aggregation = await Transaction.aggregate([
                { $match: matchQuery },
                { $group: { _id: null, totalSpent: { $sum: "$amount" } } }
            ]);

            const totalSpent = aggregation.length > 0 ? aggregation[0].totalSpent : 0;
            const remaining = Number((prevBudget.amountLimit - totalSpent).toFixed(2));

            if (remaining <= 0) {
                rolloverResults.push({
                    prevBudgetId: prevBudget._id,
                    category: prevBudget.category || "TOTAL BUDGET",
                    amountLimit: prevBudget.amountLimit,
                    totalSpent,
                    remaining: 0,
                    status: "No remaining balance to carry forward."
                });
                continue;
            }

            // 2. Determine Month 2 start and end dates (next month immediately after prevBudget.endDate)
            const nextStart = new Date(prevBudget.endDate);
            nextStart.setDate(nextStart.getDate() + 1);
            nextStart.setHours(0, 0, 0, 0);

            const nextEnd = new Date(nextStart.getFullYear(), nextStart.getMonth() + 1, 0, 23, 59, 59, 999);

            // 3. Find existing Month 2 budget for same category or create new
            let nextBudget = await Budget.findOne({
                user: prevBudget.user,
                category: prevBudget.category,
                startDate: { $lte: nextEnd },
                endDate: { $gte: nextStart }
            });

            if (nextBudget) {
                // Add remaining balance from Month 1 onto Month 2's amountLimit
                nextBudget.amountLimit = Number((nextBudget.amountLimit + remaining).toFixed(2));
                await nextBudget.save();
            } else {
                // Create Month 2 budget starting with base limit = prevBudget original limit + remaining
                nextBudget = new Budget({
                    user: prevBudget.user,
                    category: prevBudget.category,
                    amountLimit: Number((prevBudget.amountLimit + remaining).toFixed(2)),
                    period: prevBudget.period,
                    startDate: nextStart,
                    endDate: nextEnd,
                    alertThreshold: prevBudget.alertThreshold,
                    carryForward: prevBudget.carryForward
                });
                await nextBudget.save();
            }

            // Optional: Mark prevBudget carryForward as false so it doesn't get rolled over twice
            prevBudget.carryForward = false;
            await prevBudget.save();

            rolloverResults.push({
                prevBudgetId: prevBudget._id,
                category: prevBudget.category || "TOTAL BUDGET",
                prevMonthLimit: prevBudget.amountLimit,
                totalSpent,
                rolledOverAmount: remaining,
                nextBudgetId: nextBudget._id,
                nextMonthNewLimit: nextBudget.amountLimit,
                status: `Success: Rolled over ₹${remaining} from Month 1 to Month 2 budget!`
            });
        }

        return res.status(200).json({
            message: "Budget carry forward / rollover completed successfully!",
            results: rolloverResults
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to rollover budgets.", error: error.message });
    }
};

module.exports = {
    createBudget,
    getBudgets,
    updateBudget,
    deleteBudget,
    rolloverBudget
};
