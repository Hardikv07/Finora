/**
 * Finora Copilot — Data Aggregator
 *
 * Fetches and computes financial statistics from MongoDB for each intent.
 * Backend performs ALL calculations. Gemini only receives the summary.
 */

const Transaction = require('../../models/transaction');
const Budget = require('../../models/budget');
const Goal = require('../../models/goal');
const Wallet = require('../../models/wallet');
const Recurring = require('../../models/recurring');
const { INTENTS } = require('./intentClassifier');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getMonthRange = (monthOffset = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59);
  return { start, end };
};

const sumBy = (arr, key) => arr.reduce((s, x) => s + (Number(x[key]) || 0), 0);

const groupBy = (arr, keyFn) => {
  return arr.reduce((map, item) => {
    const k = keyFn(item);
    if (!map[k]) map[k] = [];
    map[k].push(item);
    return map;
  }, {});
};

const topN = (obj, n = 5) =>
  Object.entries(obj)
    .map(([key, items]) => ({ name: key, total: sumBy(items, 'amount') }))
    .sort((a, b) => b.total - a.total)
    .slice(0, n);

// ─── Intent-specific aggregators ──────────────────────────────────────────────

const aggregateCompareMonths = async (userId) => {
  const current = getMonthRange(0);
  const last = getMonthRange(-1);

  const [currentTxns, lastTxns] = await Promise.all([
    Transaction.find({ user: userId, date: { $gte: current.start, $lte: current.end } }).lean(),
    Transaction.find({ user: userId, date: { $gte: last.start, $lte: last.end } }).lean(),
  ]);

  const summarize = (txns) => {
    const income = sumBy(txns.filter(t => t.type === 'INCOME'), 'amount');
    const expense = sumBy(txns.filter(t => t.type === 'EXPENSE'), 'amount');
    const byCategory = groupBy(txns.filter(t => t.type === 'EXPENSE'), t => t.category || 'Other');
    const catSummary = topN(byCategory, 6);
    return { income, expense, savings: income - expense, topCategories: catSummary, transactionCount: txns.length };
  };

  const cur = summarize(currentTxns);
  const prev = summarize(lastTxns);

  const expenseDelta = prev.expense > 0 ? (((cur.expense - prev.expense) / prev.expense) * 100).toFixed(1) : null;
  const savingsDelta = prev.savings > 0 ? (((cur.savings - prev.savings) / prev.savings) * 100).toFixed(1) : null;

  return {
    currentMonth: { ...cur, label: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) },
    lastMonth: { ...prev, label: new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('default', { month: 'long', year: 'numeric' }) },
    deltas: { expenseChange: expenseDelta, savingsChange: savingsDelta },
  };
};

const aggregateSpendingByCategory = async (userId) => {
  const { start, end } = getMonthRange(0);
  const txns = await Transaction.find({ user: userId, type: 'EXPENSE', date: { $gte: start, $lte: end } }).lean();
  const byCategory = groupBy(txns, t => t.category || 'Other');
  const total = sumBy(txns, 'amount');
  const breakdown = topN(byCategory, 10).map(c => ({
    ...c,
    percentage: total > 0 ? ((c.total / total) * 100).toFixed(1) : '0',
  }));
  return { total, breakdown, month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) };
};

const aggregateTopMerchant = async (userId) => {
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const txns = await Transaction.find({ user: userId, type: 'EXPENSE', date: { $gte: sixMonthsAgo } }).lean();
  const byMerchant = groupBy(txns.filter(t => t.merchant), t => t.merchant);
  const ranked = topN(byMerchant, 10);
  return { merchants: ranked, periodLabel: 'Last 6 months' };
};

const aggregateTopTransaction = async (userId) => {
  const { start, end } = getMonthRange(0);
  const txns = await Transaction.find({ user: userId, date: { $gte: start, $lte: end } })
    .sort({ amount: -1 }).limit(10).lean();
  return {
    transactions: txns.map(t => ({
      merchant: t.merchant || 'Unknown',
      category: t.category,
      amount: t.amount,
      type: t.type,
      date: t.date,
    })),
  };
};

const aggregateAffordability = async (userId, targetAmount) => {
  const wallets = await Wallet.find({ user: userId }).lean();
  const totalBalance = sumBy(wallets, 'balance');

  const { start, end } = getMonthRange(0);
  const txns = await Transaction.find({ user: userId, date: { $gte: start, $lte: end } }).lean();
  const income = sumBy(txns.filter(t => t.type === 'INCOME'), 'amount');
  const expense = sumBy(txns.filter(t => t.type === 'EXPENSE'), 'amount');
  const monthlyNet = income - expense;

  const upcomingRecurring = await Recurring.find({ user: userId, isActive: true, type: 'EXPENSE' }).lean();
  const monthlyBills = sumBy(upcomingRecurring, 'amount');

  const goals = await Goal.find({ user: userId, isCompleted: false }).sort({ priority: 1 }).lean();
  const activeGoal = goals[0] || null;

  const disposable = totalBalance - monthlyBills;
  const canAfford = disposable >= (targetAmount || 0);
  const monthsToSave = targetAmount && monthlyNet > 0 ? Math.ceil((targetAmount - disposable) / monthlyNet) : null;

  return {
    totalBalance,
    monthlyIncome: income,
    monthlyExpense: expense,
    monthlySavings: monthlyNet,
    upcomingBills: monthlyBills,
    disposableIncome: disposable,
    targetAmount: targetAmount || null,
    canAfford,
    monthsToSave: canAfford ? 0 : monthsToSave,
    topGoal: activeGoal ? { title: activeGoal.title, progress: ((activeGoal.currentAmount / activeGoal.targetAmount) * 100).toFixed(1) } : null,
    wallets: wallets.map(w => ({ name: w.name, balance: w.balance })),
  };
};

const aggregateBudgetAdvice = async (userId) => {
  const { start, end } = getMonthRange(0);
  const [budgets, txns] = await Promise.all([
    Budget.find({ user: userId, startDate: { $lte: end }, endDate: { $gte: start } }).lean(),
    Transaction.find({ user: userId, type: 'EXPENSE', date: { $gte: start, $lte: end } }).lean(),
  ]);

  const byCategory = groupBy(txns, t => t.category || 'Other');

  const budgetStatus = budgets.map(b => {
    const spent = sumBy(byCategory[b.category] || [], 'amount');
    const pct = b.amountLimit > 0 ? ((spent / b.amountLimit) * 100).toFixed(1) : 0;
    return {
      category: b.category || 'Overall',
      limit: b.amountLimit,
      spent,
      remaining: Math.max(0, b.amountLimit - spent),
      percentage: pct,
      exceeded: spent > b.amountLimit,
      nearLimit: pct >= b.alertThreshold,
    };
  });

  const totalSpend = sumBy(txns, 'amount');
  return { budgets: budgetStatus, totalSpendThisMonth: totalSpend, uncategorizedSpend: sumBy(byCategory['Other'] || [], 'amount') };
};

const aggregateGoalProgress = async (userId) => {
  const goals = await Goal.find({ user: userId }).sort({ priority: 1 }).lean();
  return {
    goals: goals.map(g => {
      const pct = g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100).toFixed(1) : 0;
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      const daysLeft = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline) - Date.now()) / 86400000)) : null;
      return {
        title: g.title,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        remaining,
        progress: pct,
        daysLeft,
        priority: g.priority,
        isCompleted: g.isCompleted,
      };
    }),
  };
};

const aggregateSubscriptions = async (userId) => {
  const subs = await Recurring.find({ user: userId, isActive: true, type: 'EXPENSE' }).lean();
  const sorted = subs.sort((a, b) => b.amount - a.amount);
  const totalMonthly = sorted.reduce((s, r) => {
    if (r.frequency === 'MONTHLY') return s + r.amount;
    if (r.frequency === 'YEARLY') return s + r.amount / 12;
    if (r.frequency === 'WEEKLY') return s + r.amount * 4.33;
    return s + r.amount;
  }, 0);
  return {
    subscriptions: sorted.map(s => ({ name: s.notes || s.category, amount: s.amount, frequency: s.frequency, category: s.category })),
    totalMonthlyCommitment: Math.round(totalMonthly),
    count: subs.length,
  };
};

const aggregateWallets = async (userId) => {
  const wallets = await Wallet.find({ user: userId }).lean();
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const txns = await Transaction.find({ user: userId, date: { $gte: sixMonthsAgo } }).lean();

  const txnsByWallet = groupBy(txns, t => t.wallet?.toString());
  const walletStats = wallets.map(w => {
    const wTxns = txnsByWallet[w._id.toString()] || [];
    return {
      name: w.name,
      type: w.type,
      balance: w.balance,
      currency: w.currency,
      isDefault: w.isDefault,
      transactionCount: wTxns.length,
      totalSpent: sumBy(wTxns.filter(t => t.type === 'EXPENSE'), 'amount'),
      lastUsed: wTxns.length ? new Date(Math.max(...wTxns.map(t => new Date(t.date)))).toISOString().split('T')[0] : null,
    };
  });

  const leastUsed = [...walletStats].sort((a, b) => a.transactionCount - b.transactionCount)[0];
  const totalNetWorth = sumBy(wallets, 'balance');

  return { wallets: walletStats, leastUsed: leastUsed?.name, totalNetWorth };
};

const aggregateSavings = async (userId) => {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const { start, end } = getMonthRange(-i);
    const txns = await Transaction.find({ user: userId, date: { $gte: start, $lte: end } }).lean();
    const income = sumBy(txns.filter(t => t.type === 'INCOME'), 'amount');
    const expense = sumBy(txns.filter(t => t.type === 'EXPENSE'), 'amount');
    months.push({
      label: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
      income, expense, savings: income - expense,
    });
  }
  const totalSavings = months.reduce((s, m) => s + m.savings, 0);
  const avgMonthlySavings = Math.round(totalSavings / months.length);
  return { months, totalSavings, avgMonthlySavings };
};

const aggregateMonthlyReport = async (userId) => {
  const [catData, budgetData, topTxn] = await Promise.all([
    aggregateSpendingByCategory(userId),
    aggregateBudgetAdvice(userId),
    aggregateTopTransaction(userId),
  ]);
  const { start, end } = getMonthRange(0);
  const txns = await Transaction.find({ user: userId, date: { $gte: start, $lte: end } }).lean();
  const income = sumBy(txns.filter(t => t.type === 'INCOME'), 'amount');
  return {
    income,
    expense: catData.total,
    savings: income - catData.total,
    categoryBreakdown: catData.breakdown,
    budgetStatus: budgetData.budgets,
    topTransactions: topTxn.transactions.slice(0, 5),
    transactionCount: txns.length,
  };
};

const aggregatePredictBalance = async (userId) => {
  const wallets = await Wallet.find({ user: userId }).lean();
  const currentBalance = sumBy(wallets, 'balance');

  const { start } = getMonthRange(0);
  const daysPassed = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - daysPassed;

  const txnsSoFar = await Transaction.find({ user: userId, date: { $gte: start } }).lean();
  const dailyExpense = sumBy(txnsSoFar.filter(t => t.type === 'EXPENSE'), 'amount') / daysPassed;
  const dailyIncome = sumBy(txnsSoFar.filter(t => t.type === 'INCOME'), 'amount') / daysPassed;

  const upcomingBills = await Recurring.find({ user: userId, isActive: true, type: 'EXPENSE',
    nextRunDate: { $gte: new Date(), $lte: getMonthRange(0).end } }).lean();
  const upcomingTotal = sumBy(upcomingBills, 'amount');

  const projectedExpense = dailyExpense * daysRemaining + upcomingTotal;
  const projectedIncome = dailyIncome * daysRemaining;
  const predictedBalance = currentBalance + projectedIncome - projectedExpense;

  return {
    currentBalance,
    daysRemaining,
    projectedExpense: Math.round(projectedExpense),
    projectedIncome: Math.round(projectedIncome),
    predictedBalance: Math.round(predictedBalance),
    upcomingBills: upcomingBills.map(b => ({ name: b.notes || b.category, amount: b.amount })),
  };
};

const aggregateAnomalies = async (userId) => {
  const { start: thisStart, end: thisEnd } = getMonthRange(0);
  const { start: lastStart, end: lastEnd } = getMonthRange(-1);

  const [currentTxns, lastTxns] = await Promise.all([
    Transaction.find({ user: userId, type: 'EXPENSE', date: { $gte: thisStart, $lte: thisEnd } }).lean(),
    Transaction.find({ user: userId, type: 'EXPENSE', date: { $gte: lastStart, $lte: lastEnd } }).lean(),
  ]);

  const currentByCategory = groupBy(currentTxns, t => t.category || 'Other');
  const lastByCategory = groupBy(lastTxns, t => t.category || 'Other');
  const anomalies = [];

  for (const cat of Object.keys(currentByCategory)) {
    const cur = sumBy(currentByCategory[cat], 'amount');
    const prev = sumBy(lastByCategory[cat] || [], 'amount');
    if (prev > 0) {
      const change = ((cur - prev) / prev) * 100;
      if (change > 30) {
        anomalies.push({ category: cat, currentSpend: cur, lastSpend: prev, increase: change.toFixed(1) });
      }
    } else if (cur > 5000) {
      anomalies.push({ category: cat, currentSpend: cur, lastSpend: 0, increase: 'New category' });
    }
  }

  // Find duplicate-looking transactions
  const seen = new Map();
  const duplicates = [];
  currentTxns.forEach(t => {
    const key = `${t.merchant}-${t.amount}-${t.date?.toISOString?.()?.split('T')[0]}`;
    if (seen.has(key)) duplicates.push({ merchant: t.merchant, amount: t.amount, date: t.date });
    else seen.set(key, true);
  });

  return {
    anomalies: anomalies.sort((a, b) => Number(b.increase) - Number(a.increase)),
    duplicates,
    highestDay: (() => {
      const byDay = groupBy(currentTxns, t => new Date(t.date).toISOString().split('T')[0]);
      const days = Object.entries(byDay).map(([d, txns]) => ({ date: d, total: sumBy(txns, 'amount') }));
      return days.sort((a, b) => b.total - a.total)[0] || null;
    })(),
  };
};

// ─── Main aggregation dispatcher ─────────────────────────────────────────────

const aggregateData = async (intent, userId, entities = {}) => {
  switch (intent) {
    case INTENTS.COMPARE_MONTHS:       return aggregateCompareMonths(userId);
    case INTENTS.SPENDING_BY_CATEGORY: return aggregateSpendingByCategory(userId);
    case INTENTS.TOP_MERCHANT:         return aggregateTopMerchant(userId);
    case INTENTS.TOP_TRANSACTION:      return aggregateTopTransaction(userId);
    case INTENTS.AFFORDABILITY:        return aggregateAffordability(userId, entities.amount);
    case INTENTS.BUDGET_ADVICE:        return aggregateBudgetAdvice(userId);
    case INTENTS.GOAL_PROGRESS:        return aggregateGoalProgress(userId);
    case INTENTS.SUBSCRIPTION_ANALYSIS: return aggregateSubscriptions(userId);
    case INTENTS.WALLET_ANALYSIS:      return aggregateWallets(userId);
    case INTENTS.SAVINGS_SUMMARY:      return aggregateSavings(userId);
    case INTENTS.MONTHLY_REPORT:       return aggregateMonthlyReport(userId);
    case INTENTS.PREDICT_BALANCE:      return aggregatePredictBalance(userId);
    case INTENTS.ANOMALY_DETECTION:    return aggregateAnomalies(userId);
    default:                           return aggregateMonthlyReport(userId);
  }
};

module.exports = { aggregateData };
