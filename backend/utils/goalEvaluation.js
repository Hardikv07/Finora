const Goal = require("../models/goal");

/**
 * @desc    Automatically allocate a percentage of newly received Income to active goals
 * @param   {ObjectId} userId - User ID
 * @param   {Number} incomeAmount - Amount received from INCOME transaction
 * @returns {Array} List of auto-contribution objects applied to goals
 */
const processGoalAutoContributions = async (userId, incomeAmount) => {
    try {
        if (!incomeAmount || Number(incomeAmount) <= 0) {
            return [];
        }

        // Find all incomplete goals for this user that have autoContributePercent > 0
        const goals = await Goal.find({
            user: userId,
            isCompleted: false,
            autoContributePercent: { $gt: 0 }
        });

        if (!goals || goals.length === 0) {
            return [];
        }

        const contributions = [];

        for (const goal of goals) {
            const contributionAmount = Number(((Number(incomeAmount) * goal.autoContributePercent) / 100).toFixed(2));
            
            if (contributionAmount <= 0) continue;

            goal.currentAmount = Number((goal.currentAmount + contributionAmount).toFixed(2));
            
            if (goal.currentAmount >= goal.targetAmount) {
                goal.isCompleted = true;
            }

            await goal.save();

            contributions.push({
                goalId: goal._id,
                title: goal.title,
                autoContributePercent: goal.autoContributePercent,
                contributionAmount,
                currentAmount: goal.currentAmount,
                targetAmount: goal.targetAmount,
                isCompleted: goal.isCompleted,
                message: `🎯 Auto-Contribution: ₹${contributionAmount} (${goal.autoContributePercent}% of income) allocated to goal "${goal.title}". Progress: ₹${goal.currentAmount} / ₹${goal.targetAmount}${goal.isCompleted ? " (COMPLETED! 🎉)" : ""}`
            });
        }

        return contributions;
    } catch (error) {
        console.error("Error processing goal auto-contributions:", error);
        return [];
    }
};

module.exports = {
    processGoalAutoContributions
};
