/**
 * Finora Copilot — Prompt Builder
 *
 * Constructs the structured Gemini prompt from pre-calculated financial context.
 * Gemini NEVER receives raw transactions — only clean summaries.
 */

const { INTENTS } = require('./intentClassifier');

const CURRENCY = 'INR';
const SYMBOL = '₹';

const fmt = (n) => `${SYMBOL}${Number(n || 0).toLocaleString('en-IN')}`;

// ─── Intent-specific context formatters ──────────────────────────────────────

const formatters = {
  [INTENTS.COMPARE_MONTHS]: (ctx) => ({
    label: 'Monthly Comparison',
    summary: {
      currentMonth: ctx.currentMonth?.label,
      currentIncome: fmt(ctx.currentMonth?.income),
      currentExpense: fmt(ctx.currentMonth?.expense),
      currentSavings: fmt(ctx.currentMonth?.savings),
      lastMonth: ctx.lastMonth?.label,
      lastIncome: fmt(ctx.lastMonth?.income),
      lastExpense: fmt(ctx.lastMonth?.expense),
      lastSavings: fmt(ctx.lastMonth?.savings),
      expenseChange: ctx.deltas?.expenseChange ? `${ctx.deltas.expenseChange}%` : 'N/A',
      savingsChange: ctx.deltas?.savingsChange ? `${ctx.deltas.savingsChange}%` : 'N/A',
      topCategoriesThisMonth: ctx.currentMonth?.topCategories?.map(c => `${c.name}: ${fmt(c.total)}`),
    },
    chartHint: 'bar',
  }),

  [INTENTS.SPENDING_BY_CATEGORY]: (ctx) => ({
    label: 'Spending by Category',
    summary: {
      month: ctx.month,
      totalExpense: fmt(ctx.total),
      categories: ctx.breakdown?.map(c => ({ name: c.name, amount: fmt(c.total), share: `${c.percentage}%` })),
    },
    chartHint: 'pie',
  }),

  [INTENTS.TOP_MERCHANT]: (ctx) => ({
    label: 'Top Merchants',
    summary: {
      period: ctx.periodLabel,
      merchants: ctx.merchants?.map((m, i) => `#${i + 1} ${m.name}: ${fmt(m.total)}`),
    },
    chartHint: 'bar',
  }),

  [INTENTS.TOP_TRANSACTION]: (ctx) => ({
    label: 'Largest Transactions',
    summary: {
      transactions: ctx.transactions?.map(t => ({
        merchant: t.merchant,
        category: t.category,
        amount: fmt(t.amount),
        type: t.type,
      })),
    },
    chartHint: null,
  }),

  [INTENTS.AFFORDABILITY]: (ctx) => ({
    label: 'Affordability Analysis',
    summary: {
      currentTotalBalance: fmt(ctx.totalBalance),
      monthlyIncome: fmt(ctx.monthlyIncome),
      monthlyExpense: fmt(ctx.monthlyExpense),
      monthlySavings: fmt(ctx.monthlySavings),
      upcomingRecurringBills: fmt(ctx.upcomingBills),
      disposableIncome: fmt(ctx.disposableIncome),
      targetPurchaseAmount: ctx.targetAmount ? fmt(ctx.targetAmount) : 'Not specified',
      verdict: ctx.canAfford ? 'CAN_AFFORD' : 'CANNOT_AFFORD_NOW',
      monthsToSaveIfNeeded: ctx.monthsToSave,
      topActiveGoal: ctx.topGoal ? `${ctx.topGoal.title} (${ctx.topGoal.progress}% complete)` : 'None',
      wallets: ctx.wallets?.map(w => `${w.name}: ${fmt(w.balance)}`),
    },
    chartHint: null,
  }),

  [INTENTS.BUDGET_ADVICE]: (ctx) => ({
    label: 'Budget Status & Advice',
    summary: {
      totalSpentThisMonth: fmt(ctx.totalSpendThisMonth),
      budgets: ctx.budgets?.map(b => ({
        category: b.category,
        limit: fmt(b.limit),
        spent: fmt(b.spent),
        remaining: fmt(b.remaining),
        usagePercent: `${b.percentage}%`,
        status: b.exceeded ? 'EXCEEDED' : b.nearLimit ? 'NEAR_LIMIT' : 'OK',
      })),
    },
    chartHint: 'bar',
  }),

  [INTENTS.GOAL_PROGRESS]: (ctx) => ({
    label: 'Savings Goal Progress',
    summary: {
      goals: ctx.goals?.map(g => ({
        title: g.title,
        target: fmt(g.targetAmount),
        saved: fmt(g.currentAmount),
        remaining: fmt(g.remaining),
        progress: `${g.progress}%`,
        daysLeft: g.daysLeft !== null ? `${g.daysLeft} days` : 'No deadline',
        priority: g.priority,
        status: g.isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      })),
    },
    chartHint: 'bar',
  }),

  [INTENTS.SUBSCRIPTION_ANALYSIS]: (ctx) => ({
    label: 'Subscription & Recurring Bills',
    summary: {
      totalMonthlyCommitment: fmt(ctx.totalMonthlyCommitment),
      count: ctx.count,
      subscriptions: ctx.subscriptions?.map(s => `${s.name || s.category}: ${fmt(s.amount)} (${s.frequency})`),
    },
    chartHint: 'pie',
  }),

  [INTENTS.WALLET_ANALYSIS]: (ctx) => ({
    label: 'Wallet & Account Analysis',
    summary: {
      totalNetWorth: fmt(ctx.totalNetWorth),
      leastUsedWallet: ctx.leastUsed,
      wallets: ctx.wallets?.map(w => ({
        name: w.name,
        type: w.type,
        balance: fmt(w.balance),
        transactionsLast6Months: w.transactionCount,
        lastUsed: w.lastUsed || 'Never',
      })),
    },
    chartHint: 'bar',
  }),

  [INTENTS.SAVINGS_SUMMARY]: (ctx) => ({
    label: 'Savings Summary (6 Months)',
    summary: {
      totalSavings: fmt(ctx.totalSavings),
      avgMonthlySavings: fmt(ctx.avgMonthlySavings),
      monthlyBreakdown: ctx.months?.map(m => ({
        month: m.label,
        income: fmt(m.income),
        expense: fmt(m.expense),
        saved: fmt(m.savings),
      })),
    },
    chartHint: 'line',
  }),

  [INTENTS.MONTHLY_REPORT]: (ctx) => ({
    label: 'Monthly Financial Report',
    summary: {
      income: fmt(ctx.income),
      expense: fmt(ctx.expense),
      savings: fmt(ctx.savings),
      transactionCount: ctx.transactionCount,
      topCategories: ctx.categoryBreakdown?.slice(0, 6).map(c => `${c.name}: ${fmt(c.total)} (${c.percentage}%)`),
      budgetsExceeded: ctx.budgetStatus?.filter(b => b.exceeded).map(b => b.category),
      topTransactions: ctx.topTransactions?.map(t => `${t.merchant} - ${fmt(t.amount)}`),
    },
    chartHint: 'pie',
  }),

  [INTENTS.PREDICT_BALANCE]: (ctx) => ({
    label: 'Balance Prediction',
    summary: {
      currentBalance: fmt(ctx.currentBalance),
      daysRemaining: ctx.daysRemaining,
      projectedExpense: fmt(ctx.projectedExpense),
      projectedIncome: fmt(ctx.projectedIncome),
      predictedEndOfMonthBalance: fmt(ctx.predictedBalance),
      upcomingBills: ctx.upcomingBills?.map(b => `${b.name}: ${fmt(b.amount)}`),
    },
    chartHint: null,
  }),

  [INTENTS.ANOMALY_DETECTION]: (ctx) => ({
    label: 'Spending Anomalies',
    summary: {
      spikes: ctx.anomalies?.map(a => ({
        category: a.category,
        thisMonth: fmt(a.currentSpend),
        lastMonth: fmt(a.lastSpend),
        change: `+${a.increase}%`,
      })),
      possibleDuplicates: ctx.duplicates?.length > 0 ? ctx.duplicates.map(d => `${d.merchant}: ${fmt(d.amount)}`) : 'None found',
      highestSpendDay: ctx.highestDay ? `${ctx.highestDay.date} (${fmt(ctx.highestDay.total)})` : 'N/A',
    },
    chartHint: 'bar',
  }),
};

// ─── Chart Config Builder ─────────────────────────────────────────────────────

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
      const cur = ctx.currentMonth?.topCategories || [];
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

// ─── Main Prompt Builder ──────────────────────────────────────────────────────

const buildPrompt = (intent, context, originalMessage, conversationHistory = []) => {
  const formatter = formatters[intent] || formatters[INTENTS.MONTHLY_REPORT];
  const { label, summary } = formatter(context);
  const charts = buildChartConfig(intent, context);

  const historyText = conversationHistory.length > 0
    ? `\n\nCONVERSATION HISTORY (last ${conversationHistory.length} turns):\n` +
      conversationHistory.map(h => `${h.role === 'user' ? 'User' : 'Finora'}: ${h.content}`).join('\n')
    : '';

  const systemPrompt = `You are Finora Copilot, an expert AI financial analyst embedded in a personal finance app called Finora.

You MUST analyze the pre-calculated financial data provided below and give a helpful, personalized response.

RULES:
1. NEVER fabricate financial numbers. Use ONLY the data provided.
2. If data is missing or zero, say so clearly instead of guessing.
3. Be specific and actionable. Give concrete recommendations.
4. Use Indian financial context (rupees, Indian spending patterns).
5. Keep the answer conversational but professional.
6. End with 3 relevant follow-up questions the user might ask next.

RESPONSE FORMAT — Return ONLY valid JSON:
{
  "answer": "Clear, helpful explanation in 2-4 sentences. Use bullet points for lists.",
  "cards": [
    {"label": "Card Title", "value": "₹1,23,000", "trend": "+12%", "color": "emerald|rose|amber|blue|indigo"}
  ],
  "followUps": ["Question 1?", "Question 2?", "Question 3?"],
  "confidence": 90,
  "highlights": ["Key insight 1", "Key insight 2", "Key insight 3"]
}
${historyText}

USER QUESTION: "${originalMessage}"

FINANCIAL CONTEXT (${label}):
${JSON.stringify(summary, null, 2)}

Remember: Return ONLY the JSON object. No markdown code blocks.`;

  return { systemPrompt, charts };
};

module.exports = { buildPrompt };
