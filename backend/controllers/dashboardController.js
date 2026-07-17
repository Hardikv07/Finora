const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");
const Budget = require("../models/budget");
const Bill = require("../models/bill");
const Loan = require("../models/loan");
const Investment = require("../models/investment");

/**
 * @desc    Get comprehensive SaaS Dashboard summary (Balance, Income/Expense, Cash Flow, Financial Health Score, etc.)
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // 1. Wallets & Total Balance
        const wallets = await Wallet.find({ user: userId });
        const totalBalance = Number(wallets.reduce((acc, w) => acc + (w.balance || 0), 0).toFixed(2));

        // 2. Transactions aggregation for Current Month Income & Expense
        const currentMonthStats = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    date: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
                }
            },
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        let monthlyIncome = 0;
        let monthlyExpense = 0;
        currentMonthStats.forEach(stat => {
            if (stat._id === "INCOME") monthlyIncome = stat.totalAmount;
            if (stat._id === "EXPENSE") monthlyExpense = stat.totalAmount;
        });

        // 3. All-time total Income & Expense
        const allTimeStats = await Transaction.aggregate([
            { $match: { user: userId } },
            { $group: { _id: "$type", totalAmount: { $sum: "$amount" } } }
        ]);

        let allTimeIncome = 0;
        let allTimeExpense = 0;
        allTimeStats.forEach(stat => {
            if (stat._id === "INCOME") allTimeIncome = stat.totalAmount;
            if (stat._id === "EXPENSE") allTimeExpense = stat.totalAmount;
        });

        const monthlySavings = Number((monthlyIncome - monthlyExpense).toFixed(2));
        const savingsRate = monthlyIncome > 0 
            ? Number(((monthlySavings / monthlyIncome) * 100).toFixed(2)) 
            : 0;

        // 4. Monthly Cash Flow Trend (Last 6 Months)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const monthlyTrend = await Transaction.aggregate([
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
        const cashFlowMap = {};

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            cashFlowMap[key] = { month: key, income: 0, expense: 0, net: 0 };
        }

        monthlyTrend.forEach(item => {
            const mIndex = item._id.month - 1;
            const key = `${monthNames[mIndex]} ${item._id.year}`;
            if (cashFlowMap[key]) {
                if (item._id.type === "INCOME") cashFlowMap[key].income = Number(item.total.toFixed(2));
                if (item._id.type === "EXPENSE") cashFlowMap[key].expense = Number(item.total.toFixed(2));
                cashFlowMap[key].net = Number((cashFlowMap[key].income - cashFlowMap[key].expense).toFixed(2));
            }
        });
        const monthlyCashFlow = Object.values(cashFlowMap);

        // 5. Weekly Spending Breakdown (Current Week: Mon -> Sun)
        const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const weeklyStats = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: "EXPENSE",
                    date: { $gte: startOfWeek }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$date" }, // 1 is Sun, 2 is Mon, ... 7 is Sat
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const daysLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weeklyMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        weeklyStats.forEach(item => {
            const dayName = daysLabel[item._id - 1];
            weeklyMap[dayName] = Number(item.total.toFixed(2));
        });
        const weeklySpending = Object.keys(weeklyMap).map(day => ({ day, amount: weeklyMap[day] }));

        // 6. Budget Progress (Current active budgets vs spent amount)
        const activeBudgets = await Budget.find({
            user: userId,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        const budgetProgress = await Promise.all(activeBudgets.map(async (budget) => {
            const matchQuery = {
                user: userId,
                type: "EXPENSE",
                date: { $gte: budget.startDate, $lte: budget.endDate }
            };
            if (budget.category && budget.category !== "ALL") {
                matchQuery.category = budget.category;
            }
            const agg = await Transaction.aggregate([
                { $match: matchQuery },
                { $group: { _id: null, spent: { $sum: "$amount" } } }
            ]);
            const spent = agg.length > 0 ? Number(agg[0].spent.toFixed(2)) : 0;
            const remaining = Number(Math.max(0, budget.amountLimit - spent).toFixed(2));
            const percentageUsed = Math.min(100, Math.round((spent / budget.amountLimit) * 100));
            return {
                budgetId: budget._id,
                category: budget.category || "Total Overall Budget",
                amountLimit: budget.amountLimit,
                spent,
                remaining,
                percentageUsed,
                isBreached: spent >= budget.amountLimit,
                alertThreshold: budget.alertThreshold
            };
        }));

        // 7. Upcoming Bills & Recent Transactions
        const upcomingBills = await Bill.find({ user: userId, status: { $ne: "PAID" } })
            .sort({ dueDate: 1 })
            .limit(6);

        const recentTransactions = await Transaction.find({ user: userId })
            .populate("wallet", "name type currency color")
            .sort({ date: -1 })
            .limit(8);

        // 8. Investment & Loan summary
        const investments = await Investment.find({ user: userId });
        const totalInvested = investments.reduce((acc, inv) => acc + (inv.investedAmount || 0), 0);
        const totalInvestmentValue = investments.reduce((acc, inv) => acc + (inv.currentValue || 0), 0);

        const loans = await Loan.find({ user: userId, isClosed: false });
        const totalRemainingDebt = loans.reduce((acc, l) => acc + (l.remainingBalance || 0), 0);
        const totalEmiBurden = loans.reduce((acc, l) => acc + (l.monthlyEmi || 0), 0);

        // 9. FINANCIAL HEALTH SCORE CALCULATION (Score 0 - 100)
        let healthScore = 0;
        const scoreBreakdown = {};
        const recommendations = [];

        // A. Savings Rate (Max 25 points)
        if (savingsRate >= 20) {
            scoreBreakdown.savingsRateScore = 25;
            recommendations.push("✅ Excellent savings rate (>20%)! Keep consistently investing your surplus.");
        } else if (savingsRate >= 10) {
            scoreBreakdown.savingsRateScore = 15;
            recommendations.push("💡 Good savings rate (10-20%), but aim to trim non-essential spending to reach 20%+.");
        } else if (savingsRate > 0) {
            scoreBreakdown.savingsRateScore = 8;
            recommendations.push("⚠️ Your savings rate is low (<10%). Review your category budgets immediately.");
        } else {
            scoreBreakdown.savingsRateScore = 0;
            recommendations.push("🚨 Negative or zero cash flow this month! Your expenses exceed your income.");
        }
        healthScore += scoreBreakdown.savingsRateScore;

        // B. Debt-to-Income Ratio (Max 25 points)
        const monthlyDebtBurden = totalEmiBurden;
        const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyDebtBurden / monthlyIncome) * 100 : (monthlyDebtBurden > 0 ? 100 : 0);
        if (debtToIncomeRatio === 0) {
            scoreBreakdown.debtScore = 25;
            recommendations.push("🌟 Debt-free! You have zero monthly EMI obligations.");
        } else if (debtToIncomeRatio <= 25) {
            scoreBreakdown.debtScore = 20;
            recommendations.push("✅ Healthy Debt-to-Income ratio (<=25%). Your loan repayments are well within safe limits.");
        } else if (debtToIncomeRatio <= 40) {
            scoreBreakdown.debtScore = 12;
            recommendations.push("⚠️ Moderate Debt-to-Income ratio (25-40%). Avoid taking on any new high-interest debt.");
        } else {
            scoreBreakdown.debtScore = 5;
            recommendations.push("🚨 High Debt-to-Income ratio (>40%)! Focus aggressively on paying off high-interest loans first.");
        }
        healthScore += scoreBreakdown.debtScore;

        // C. Budget Adherence (Max 20 points)
        const breachedBudgetsCount = budgetProgress.filter(b => b.isBreached).length;
        if (activeBudgets.length === 0) {
            scoreBreakdown.budgetScore = 10; // Neutral if no budgets created
            recommendations.push("📋 Create monthly budgets for major categories (Food, Rent, Shopping) to track discipline.");
        } else if (breachedBudgetsCount === 0) {
            scoreBreakdown.budgetScore = 20;
            recommendations.push("🎯 Perfect budget adherence! All active budgets are under limit.");
        } else {
            scoreBreakdown.budgetScore = Math.max(0, 20 - breachedBudgetsCount * 8);
            recommendations.push(`⚠️ You have breached ${breachedBudgetsCount} category budget limit(s) this period.`);
        }
        healthScore += scoreBreakdown.budgetScore;

        // D. Emergency Fund Coverage (Max 15 points: target 3x monthly expense)
        const emergencyCoverageMonths = monthlyExpense > 0 ? totalBalance / monthlyExpense : (totalBalance > 0 ? 6 : 0);
        if (emergencyCoverageMonths >= 3) {
            scoreBreakdown.emergencyFundScore = 15;
            recommendations.push(`🛡️ Strong emergency fund! Your liquid balance covers ${Math.round(emergencyCoverageMonths * 10) / 10} months of expenses.`);
        } else if (emergencyCoverageMonths >= 1) {
            scoreBreakdown.emergencyFundScore = 8;
            recommendations.push(`⚠️ Your emergency fund only covers ${Math.round(emergencyCoverageMonths * 10) / 10} month(s). Aim for at least 3-6 months of reserves.`);
        } else {
            scoreBreakdown.emergencyFundScore = 2;
            recommendations.push("🚨 Critical: Insufficient liquid balance to survive even 1 month of unexpected emergencies.");
        }
        healthScore += scoreBreakdown.emergencyFundScore;

        // E. Investment Allocation (Max 15 points)
        if (totalInvestmentValue >= totalBalance * 0.5 && totalInvestmentValue > 0) {
            scoreBreakdown.investmentScore = 15;
            recommendations.push("🚀 Great wealth building habits! More than 50% of your net assets are working for you in investments.");
        } else if (totalInvestmentValue > 0) {
            scoreBreakdown.investmentScore = 10;
            recommendations.push("📈 Active investment portfolio detected. Consider starting a systematic monthly SIP.");
        } else {
            scoreBreakdown.investmentScore = 0;
            recommendations.push("💡 You currently have 0 investments recorded. Start investing to beat inflation and compound wealth.");
        }
        healthScore += scoreBreakdown.investmentScore;

        res.status(200).json({
            dashboard: {
                totalBalance,
                monthlyOverview: {
                    income: Number(monthlyIncome.toFixed(2)),
                    expense: Number(monthlyExpense.toFixed(2)),
                    savings: monthlySavings,
                    savingsRate
                },
                allTimeOverview: {
                    income: Number(allTimeIncome.toFixed(2)),
                    expense: Number(allTimeExpense.toFixed(2)),
                    netWorthOrSurplus: Number((allTimeIncome - allTimeExpense).toFixed(2))
                },
                monthlyCashFlow,
                weeklySpending,
                budgetProgress,
                upcomingBills,
                recentTransactions,
                portfolioSummary: {
                    totalInvested: Number(totalInvested.toFixed(2)),
                    totalCurrentValue: Number(totalInvestmentValue.toFixed(2)),
                    totalDebtRemaining: Number(totalRemainingDebt.toFixed(2))
                },
                financialHealthScore: {
                    score: healthScore,
                    grade: healthScore >= 80 ? "A+" : healthScore >= 65 ? "B" : healthScore >= 50 ? "C" : "D",
                    status: healthScore >= 80 ? "Excellent" : healthScore >= 65 ? "Good" : healthScore >= 50 ? "Needs Improvement" : "Critical Attention Needed",
                    scoreBreakdown,
                    recommendations
                }
            }
        });
    } catch (error) {
        console.error("Error generating dashboard data:", error);
        res.status(500).json({ message: "Failed to generate dashboard statistics", error: error.message });
    }
};

module.exports = {
    getDashboardData
};
