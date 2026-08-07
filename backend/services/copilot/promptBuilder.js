/**
 * Finora Copilot — Local Response Generator
 *
 * Generates natural language financial answers, cards, charts, and follow-up prompts
 * directly from pre-calculated MongoDB financial statistics. 
 * Completely local — 0 external API calls!
 */

const { INTENTS } = require('./intentClassifier');

const SYMBOL = '₹';
const fmt = (n) => `${SYMBOL}${Number(n || 0).toLocaleString('en-IN')}`;

const buildChartConfig = (intent, ctx) => {
  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

  try {
    if (intent === INTENTS.SPENDING_BY_CATEGORY && ctx.breakdown?.length) {
      return [{
        type: 'pie',
        title: 'Spending by Category',
        labels: ctx.breakdown.map(c => c.name),
        data: ctx.breakdown.map(c => c.total),
        colors: ctx.breakdown.map((_, i) => COLORS[i % COLORS.length]),
      }];
    }
    if (intent === INTENTS.SAVINGS_SUMMARY && ctx.months?.length) {
      return [{
        type: 'line',
        title: 'Monthly Savings Trend',
        labels: ctx.months.map(m => m.label),
        data: ctx.months.map(m => m.savings),
        colors: ['#6366f1'],
      }];
    }
    if (intent === INTENTS.COMPARE_MONTHS) {
      return [{
        type: 'bar',
        title: 'This Month vs Last Month — Expenses',
        labels: ['Income', 'Expenses', 'Savings'],
        datasets: [
          { label: ctx.currentMonth?.label || 'This Month', data: [ctx.currentMonth?.income, ctx.currentMonth?.expense, ctx.currentMonth?.savings], color: '#6366f1' },
          { label: ctx.lastMonth?.label || 'Last Month', data: [ctx.lastMonth?.income, ctx.lastMonth?.expense, ctx.lastMonth?.savings], color: '#94a3b8' },
        ],
      }];
    }
    if (intent === INTENTS.TOP_MERCHANT && ctx.merchants?.length) {
      return [{
        type: 'bar',
        title: 'Top Merchants by Spend',
        labels: ctx.merchants.map(m => m.name),
        data: ctx.merchants.map(m => m.total),
        colors: [COLORS[0]],
      }];
    }
    if (intent === INTENTS.SUBSCRIPTION_ANALYSIS && ctx.subscriptions?.length) {
      return [{
        type: 'pie',
        title: 'Subscription Breakdown',
        labels: ctx.subscriptions.map(s => s.name || s.category),
        data: ctx.subscriptions.map(s => s.amount),
        colors: ctx.subscriptions.map((_, i) => COLORS[i % COLORS.length]),
      }];
    }
    if (intent === INTENTS.BUDGET_ADVICE && ctx.budgets?.length) {
      return [{
        type: 'bar',
        title: 'Budget Utilization',
        labels: ctx.budgets.map(b => b.category),
        datasets: [
          { label: 'Limit', data: ctx.budgets.map(b => b.limit), color: '#94a3b8' },
          { label: 'Spent', data: ctx.budgets.map(b => b.spent), color: '#ef4444' },
        ],
      }];
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * Generates local natural language answers and cards per intent.
 */
const buildLocalResponse = (intent, context, originalMessage) => {
  const charts = buildChartConfig(intent, context);

  let answer = "";
  let cards = [];
  let highlights = [];
  let followUps = [];

  switch (intent) {
    case INTENTS.COMPARE_MONTHS: {
      const cur = context.currentMonth || {};
      const prev = context.lastMonth || {};
      const expenseChange = context.deltas?.expenseChange;
      answer = `In **${cur.label}**, you spent **${fmt(cur.expense)}** and saved **${fmt(cur.savings)}**.\n\n` +
        `Compared to **${prev.label}** (${fmt(prev.expense)} spent), your expenses are ${expenseChange ? `${expenseChange}%` : 'calculated'}.\n` +
        `Top expense category: ${cur.topCategories?.[0]?.name || 'N/A'} (${fmt(cur.topCategories?.[0]?.total || 0)}).`;
      cards = [
        { label: "This Month Spend", value: fmt(cur.expense), color: "indigo" },
        { label: "Last Month Spend", value: fmt(prev.expense), color: "slate" },
        { label: "Savings Change", value: context.deltas?.savingsChange ? `${context.deltas.savingsChange}%` : 'N/A', color: "emerald" }
      ];
      followUps = ["Where am I spending the most?", "Show budget status", "Predict my balance"];
      break;
    }

    case INTENTS.SPENDING_BY_CATEGORY: {
      const topCat = context.breakdown?.[0];
      answer = `Total spending for **${context.month}** is **${fmt(context.total)}** across ${context.breakdown?.length || 0} categories.\n\n` +
        `Your top spending categories:\n` +
        (context.breakdown || []).slice(0, 4).map(c => `• **${c.name}**: ${fmt(c.total)} (${c.percentage}%)`).join('\n');
      cards = [
        { label: "Total Expense", value: fmt(context.total), color: "rose" },
        { label: "Top Category", value: topCat ? `${topCat.name} (${topCat.percentage}%)` : "N/A", color: "amber" }
      ];
      followUps = ["Compare with last month", "Which subscriptions cost the most?", "View budget alerts"];
      break;
    }

    case INTENTS.TOP_MERCHANT: {
      const topM = context.merchants?.[0];
      answer = `Over the **${context.periodLabel}**, your highest merchant spending was at **${topM?.name || 'N/A'}** (${fmt(topM?.total || 0)}).\n\n` +
        `Top merchants:\n` +
        (context.merchants || []).slice(0, 5).map((m, i) => `• #${i+1} **${m.name}**: ${fmt(m.total)}`).join('\n');
      cards = [
        { label: "Top Merchant", value: topM?.name || 'N/A', color: "indigo" },
        { label: "Total Spent", value: fmt(topM?.total), color: "rose" }
      ];
      followUps = ["Find Swiggy purchases", "Show category breakdown", "Search largest transactions"];
      break;
    }

    case INTENTS.TOP_TRANSACTION: {
      const topT = context.transactions?.[0];
      answer = `Your largest transaction this month is **${topT?.merchant || topT?.category}** of **${fmt(topT?.amount)}** (${topT?.type || 'EXPENSE'}).\n\n` +
        `Highest records:\n` +
        (context.transactions || []).slice(0, 5).map(t => `• **${fmt(t.amount)}** – ${t.merchant || t.category} (${t.type})`).join('\n');
      cards = [
        { label: "Largest Transaction", value: fmt(topT?.amount), color: "indigo" },
        { label: "Merchant", value: topT?.merchant || topT?.category || 'N/A', color: "blue" }
      ];
      followUps = ["Show all transactions over ₹5,000", "Compare with last month", "Show budget status"];
      break;
    }

    case INTENTS.AFFORDABILITY: {
      answer = context.canAfford
        ? `Yes! Based on your total wallet balance of **${fmt(context.totalBalance)}**, you can afford this purchase.\n\nYour disposable income after upcoming recurring bills (${fmt(context.upcomingBills)}) is **${fmt(context.disposableIncome)}**.`
        : `Your current total balance is **${fmt(context.totalBalance)}**. After accounting for upcoming bills (${fmt(context.upcomingBills)}), you may want to save for ${context.monthsToSave || 1} more month(s) before making this purchase.`;
      cards = [
        { label: "Total Balance", value: fmt(context.totalBalance), color: "indigo" },
        { label: "Disposable Income", value: fmt(context.disposableIncome), color: context.canAfford ? "emerald" : "rose" }
      ];
      followUps = ["How close am I to my savings goal?", "Predict end of month balance", "Show recurring bills"];
      break;
    }

    case INTENTS.BUDGET_ADVICE: {
      const exceeded = (context.budgets || []).filter(b => b.exceeded);
      answer = `You have spent **${fmt(context.totalSpendThisMonth)}** this month.\n\n` +
        (exceeded.length > 0
          ? `⚠️ You have exceeded **${exceeded.length} budget(s)**: ${exceeded.map(b => b.category).join(', ')}.`
          : `✅ All your active category budgets are currently within limit!`) +
        `\n\nBudget details:\n` +
        (context.budgets || []).map(b => `• **${b.category}**: ${fmt(b.spent)} / ${fmt(b.limit)} (${b.percentage}%)`).join('\n');
      cards = [
        { label: "Total Spend", value: fmt(context.totalSpendThisMonth), color: "indigo" },
        { label: "Budgets Exceeded", value: `${exceeded.length}`, color: exceeded.length > 0 ? "rose" : "emerald" }
      ];
      followUps = ["Where am I spending the most?", "How much have I saved?", "Predict balance"];
      break;
    }

    case INTENTS.GOAL_PROGRESS: {
      const topG = context.goals?.[0];
      answer = context.goals?.length > 0
        ? `You have **${context.goals.length} savings goal(s)**.\n\n` +
          `Your top goal **"${topG.title}"** is at **${topG.progress}%** (${fmt(topG.currentAmount)} / ${fmt(topG.targetAmount)}).\n` +
          context.goals.map(g => `• **${g.title}**: ${g.progress}% (${fmt(g.currentAmount)} saved, ${fmt(g.remaining)} left)`).join('\n')
        : `You don't have any active savings goals yet. Create your first goal under Goals to start tracking!`;
      cards = [
        { label: "Top Goal Progress", value: topG ? `${topG.progress}%` : "0%", color: "emerald" },
        { label: "Total Saved", value: topG ? fmt(topG.currentAmount) : "₹0", color: "indigo" }
      ];
      followUps = ["Can I afford a purchase?", "Show savings summary", "Predict my balance"];
      break;
    }

    case INTENTS.SUBSCRIPTION_ANALYSIS: {
      answer = `You have **${context.count} active recurring subscription(s)** totaling **${fmt(context.totalMonthlyCommitment)}/month**.\n\n` +
        (context.subscriptions || []).map(s => `• **${s.name || s.category}**: ${fmt(s.amount)} (${s.frequency})`).join('\n');
      cards = [
        { label: "Monthly Subscriptions", value: fmt(context.totalMonthlyCommitment), color: "rose" },
        { label: "Active Count", value: `${context.count}`, color: "indigo" }
      ];
      followUps = ["Show spending by category", "Show budget status", "Predict balance"];
      break;
    }

    default: {
      answer = `Here is your current financial summary:\n\n` +
        `• **Income**: ${fmt(context.income)}\n` +
        `• **Expenses**: ${fmt(context.expense)}\n` +
        `• **Net Savings**: ${fmt(context.savings)}\n` +
        `• **Transactions recorded**: ${context.transactionCount || 0}`;
      cards = [
        { label: "Income", value: fmt(context.income), color: "emerald" },
        { label: "Expenses", value: fmt(context.expense), color: "rose" },
        { label: "Savings", value: fmt(context.savings), color: "indigo" }
      ];
      followUps = ["Compare with last month", "Where am I spending the most?", "Show my goals"];
      break;
    }
  }

  return {
    answer,
    cards,
    charts,
    followUps,
    highlights,
    confidence: 100
  };
};

const buildPrompt = (intent, context, originalMessage) => {
  const localRes = buildLocalResponse(intent, context, originalMessage);
  return { systemPrompt: "", charts: localRes.charts, localResponse: localRes };
};

module.exports = { buildPrompt, buildLocalResponse };
