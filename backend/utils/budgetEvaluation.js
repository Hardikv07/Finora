const Budget = require("../models/budget");
const Transaction = require("../models/transaction");

/**
 * @desc    Evaluate whether a new Expense breaches any active budget alert thresholds
 * @param   {ObjectId} userId - User ID
 * @param   {String} category - Transaction category (e.g., 'Food', 'Rent')
 * @param   {Date} date - Transaction date
 * @param   {Number} newExpenseAmount - Expense amount being added
 * @returns {Array} List of budget alert objects triggered by this expense
 */
const evaluateBudgetAlerts = async (userId, category, date, newExpenseAmount) => {
    try {
        const expenseDate = new Date(date || Date.now());
        
        // Find all active budgets covering this date where:
        // 1. Category matches exactly, OR
        // 2. Category is null/empty/ALL (representing Total overall budget)
        const budgets = await Budget.find({
            user: userId,
            startDate: { $lte: expenseDate },
            endDate: { $gte: expenseDate }
        });

        if (!budgets || budgets.length === 0) {
            return [];
        }

        const alerts = [];

        for (const budget of budgets) {
            // Check if this budget applies to our expense category
            const isCategoryBudget = budget.category && budget.category.trim() !== "" && budget.category !== "ALL";
            if (isCategoryBudget && budget.category.toLowerCase() !== (category || "").toLowerCase()) {
                continue; // Skip category budgets that don't match our transaction category
            }

            // Match query for calculating existing total expenses within this budget's timeframe
            const matchQuery = {
                user: budget.user,
                type: "EXPENSE",
                date: { $gte: budget.startDate, $lte: budget.endDate }
            };

            if (isCategoryBudget) {
                matchQuery.category = budget.category;
            }

            const aggregationResult = await Transaction.aggregate([
                { $match: matchQuery },
                { $group: { _id: null, totalSpent: { $sum: "$amount" } } }
            ]);

            const currentSpent = aggregationResult.length > 0 ? aggregationResult[0].totalSpent : 0;
            const totalSpentWithNewExpense = Number((currentSpent + Number(newExpenseAmount)).toFixed(2));
            const thresholdAmount = Number((budget.amountLimit * (budget.alertThreshold / 100)).toFixed(2));
            const percentageUsed = Math.round((totalSpentWithNewExpense / budget.amountLimit) * 100);

            // Check if threshold is met or breached
            if (totalSpentWithNewExpense >= thresholdAmount) {
                alerts.push({
                    triggered: true,
                    budgetId: budget._id,
                    category: budget.category || "TOTAL OVERALL BUDGET",
                    period: budget.period,
                    amountLimit: budget.amountLimit,
                    totalSpent: totalSpentWithNewExpense,
                    remaining: Number(Math.max(0, budget.amountLimit - totalSpentWithNewExpense).toFixed(2)),
                    percentageUsed,
                    alertThreshold: budget.alertThreshold,
                    message: `⚠️ Budget Alert: You have used ${percentageUsed}% (₹${totalSpentWithNewExpense}) of your ${budget.category || "Total Monthly"} budget of ₹${budget.amountLimit}. Threshold is ${budget.alertThreshold}%.`
                });
            }
        }

        return alerts;
    } catch (error) {
        console.error("Error evaluating budget alerts:", error);
        return [];
    }
};

module.exports = {
    evaluateBudgetAlerts
};
