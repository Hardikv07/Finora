const Goal = require("../models/goal");
const Wallet = require("../models/wallet");

/**
 * @desc    Create new financial goal
 * @route   POST /api/goals
 * @access  Private
 */
const createGoal = async (req, res) => {
    try {
        const { title, targetAmount, deadline, priority = "Med", autoContributePercent = 0 } = req.body;

        if (!title || !targetAmount || !deadline) {
            return res.status(400).json({ message: "Title, targetAmount, and deadline are required." });
        }

        const goal = new Goal({
            user: req.user._id,
            title: title.trim(),
            targetAmount: Number(targetAmount),
            deadline: new Date(deadline),
            priority: priority || "Med",
            autoContributePercent: Number(autoContributePercent) || 0
        });

        await goal.save();

        return res.status(201).json({
            message: "Goal created successfully!",
            goal
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to create goal.", error: error.message });
    }
};

/**
 * @desc    Get all financial goals for user with progress percentage
 * @route   GET /api/goals
 * @access  Private
 */
const getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user._id }).sort({ isCompleted: 1, deadline: 1 });

        const enrichedGoals = goals.map(goal => {
            const progressPercent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, Number((goal.targetAmount - goal.currentAmount).toFixed(2)));
            return {
                ...goal.toObject(),
                progressPercent,
                remaining
            };
        });

        return res.status(200).json({ goals: enrichedGoals });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch goals.", error: error.message });
    }
};

/**
 * @desc    Update financial goal
 * @route   PUT /api/goals/:id
 * @access  Private
 */
const updateGoal = async (req, res) => {
    try {
        const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
        if (!goal) {
            return res.status(404).json({ message: "Goal not found." });
        }

        Object.assign(goal, req.body);
        if (req.body.targetAmount) goal.targetAmount = Number(req.body.targetAmount);
        if (req.body.currentAmount !== undefined) {
            goal.currentAmount = Number(req.body.currentAmount);
            goal.isCompleted = goal.currentAmount >= goal.targetAmount;
        }

        await goal.save();

        return res.status(200).json({
            message: "Goal updated successfully!",
            goal
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update goal.", error: error.message });
    }
};

/**
 * @desc    Delete financial goal
 * @route   DELETE /api/goals/:id
 * @access  Private
 */
const deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!goal) {
            return res.status(404).json({ message: "Goal not found." });
        }

        return res.status(200).json({ message: "Goal deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete goal.", error: error.message });
    }
};

/**
 * @desc    Manual contribution towards a goal (with optional wallet deduction)
 * @route   POST /api/goals/:id/contribute
 * @access  Private
 */
const contributeToGoal = async (req, res) => {
    try {
        const { amount, walletId } = req.body;
        const contribution = Number(amount);

        if (!contribution || contribution <= 0) {
            return res.status(400).json({ message: "Contribution amount must be greater than zero." });
        }

        const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
        if (!goal) {
            return res.status(404).json({ message: "Goal not found." });
        }

        // If walletId provided, check balance and deduct
        if (walletId) {
            const wallet = await Wallet.findOne({ _id: walletId, user: req.user._id });
            if (!wallet) {
                return res.status(404).json({ message: "Specified wallet not found." });
            }
            if (wallet.balance < contribution) {
                return res.status(400).json({ message: `Insufficient funds in wallet (${wallet.name}). Balance is ₹${wallet.balance}.` });
            }
            wallet.balance = Number((wallet.balance - contribution).toFixed(2));
            await wallet.save();
        }

        goal.currentAmount = Number((goal.currentAmount + contribution).toFixed(2));
        if (goal.currentAmount >= goal.targetAmount) {
            goal.isCompleted = true;
        }

        await goal.save();

        return res.status(200).json({
            message: `Successfully contributed ₹${contribution} to goal "${goal.title}"!`,
            goal,
            walletDeducted: Boolean(walletId)
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to contribute to goal.", error: error.message });
    }
};

module.exports = {
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal,
    contributeToGoal
};
