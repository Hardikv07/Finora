/**
 * Financial Calculation & Health Engine for Finora
 */

export const calculateCashFlow = (transactions = []) => {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amount;
    } else if (tx.type === 'expense') {
      totalExpense += amount;
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  return {
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate
  };
};

export const calculateFinancialHealthScore = ({ transactions = [], budgets = [], goals = [], wallets = [] }) => {
  let score = 50; // Base score

  const { savingsRate } = calculateCashFlow(transactions);

  // 1. Savings Rate component (+/- up to 25 points)
  if (savingsRate >= 40) score += 25;
  else if (savingsRate >= 20) score += 15;
  else if (savingsRate >= 10) score += 5;
  else if (savingsRate < 0) score -= 15;

  // 2. Budget adherence (+/- up to 15 points)
  if (budgets.length > 0) {
    const overBudgetCount = budgets.filter((b) => b.spent > b.limit).length;
    if (overBudgetCount === 0) score += 15;
    else if (overBudgetCount === 1) score += 5;
    else score -= 10;
  } else {
    score += 5;
  }

  // 3. Emergency fund & Goal coverage (+/- up to 10 points)
  const emergencyGoal = goals.find((g) => g.title?.toLowerCase().includes("emergency"));
  if (emergencyGoal && emergencyGoal.currentAmount >= emergencyGoal.targetAmount * 0.5) {
    score += 10;
  } else if (goals.length > 0) {
    score += 5;
  }

  return Math.min(Math.max(Math.round(score), 0), 100);
};

export const getCategoryExpenses = (transactions = []) => {
  const categoryMap = {};

  transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const cat = tx.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(tx.amount);
    });

  return Object.entries(categoryMap).map(([name, amount]) => ({
    name,
    amount
  })).sort((a, b) => b.amount - a.amount);
};
