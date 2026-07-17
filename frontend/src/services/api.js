import {
  INITIAL_USER,
  INITIAL_WALLETS,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
  INITIAL_RECURRING
} from '../constants/dummyData';

const BASE_URL = 'http://localhost:5000/api';

// Helper to get or initialize localStorage
const getLocalData = (key, initialValue) => {
  try {
    const item = localStorage.getItem(`finora_${key}`);
    if (!item) {
      localStorage.setItem(`finora_${key}`, JSON.stringify(initialValue));
      return initialValue;
    }
    return JSON.parse(item);
  } catch (e) {
    return initialValue;
  }
};

const setLocalData = (key, value) => {
  try {
    localStorage.setItem(`finora_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed saving ${key} to local storage`, e);
  }
};

/**
 * Generic fetch wrapper with automatic fallback to local storage
 */
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200); // Fast timeout to fallback gracefully

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    // Graceful offline / fallback to local storage
    return null;
  }
};

export const apiService = {
  // User Profile
  getUserProfile: async () => {
    const res = await apiRequest('/auth/profile');
    return res?.user || getLocalData('user', INITIAL_USER);
  },
  updateUserProfile: async (data) => {
    const current = getLocalData('user', INITIAL_USER);
    const updated = { ...current, ...data };
    setLocalData('user', updated);
    return updated;
  },

  // Wallets
  getWallets: async () => {
    const res = await apiRequest('/wallets');
    return res?.wallets || getLocalData('wallets', INITIAL_WALLETS);
  },
  createWallet: async (walletData) => {
    const current = getLocalData('wallets', INITIAL_WALLETS);
    const newWallet = {
      _id: 'w_' + Date.now(),
      balance: Number(walletData.balance || 0),
      color: 'from-blue-600 to-indigo-700',
      ...walletData
    };
    const updated = [newWallet, ...current];
    setLocalData('wallets', updated);
    return newWallet;
  },
  updateWallet: async (id, walletData) => {
    const current = getLocalData('wallets', INITIAL_WALLETS);
    const updated = current.map((w) => w._id === id ? { ...w, ...walletData, balance: Number(walletData.balance ?? w.balance) } : w);
    setLocalData('wallets', updated);
    return updated.find((w) => w._id === id);
  },
  deleteWallet: async (id) => {
    const current = getLocalData('wallets', INITIAL_WALLETS);
    const updated = current.filter((w) => w._id !== id);
    setLocalData('wallets', updated);
    return true;
  },
  transferFunds: async ({ fromWalletId, toWalletId, amount }) => {
    const current = getLocalData('wallets', INITIAL_WALLETS);
    const numAmount = Number(amount);
    const updated = current.map((w) => {
      if (w._id === fromWalletId) return { ...w, balance: w.balance - numAmount };
      if (w._id === toWalletId) return { ...w, balance: w.balance + numAmount };
      return w;
    });
    setLocalData('wallets', updated);
    return updated;
  },

  // Transactions
  getTransactions: async () => {
    const res = await apiRequest('/transactions');
    return res?.transactions || getLocalData('transactions', INITIAL_TRANSACTIONS);
  },
  createTransaction: async (txData) => {
    const current = getLocalData('transactions', INITIAL_TRANSACTIONS);
    const newTx = {
      _id: 'tx_' + Date.now(),
      date: txData.date || new Date().toISOString(),
      amount: Number(txData.amount || 0),
      tags: typeof txData.tags === 'string' ? txData.tags.split(',').map((t) => t.trim()) : (txData.tags || []),
      hasReceipt: Boolean(txData.hasReceipt),
      ...txData
    };
    const updated = [newTx, ...current];
    setLocalData('transactions', updated);

    // Auto update wallet balance if walletId is provided
    if (newTx.walletId) {
      const wallets = getLocalData('wallets', INITIAL_WALLETS);
      const updatedWallets = wallets.map((w) => {
        if (w._id === newTx.walletId) {
          const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
          return { ...w, balance: w.balance + delta };
        }
        return w;
      });
      setLocalData('wallets', updatedWallets);
    }

    // Auto update budget spent if expense
    if (newTx.type === 'expense') {
      const budgets = getLocalData('budgets', INITIAL_BUDGETS);
      const updatedBudgets = budgets.map((b) => {
        if (b.category === newTx.category) {
          return { ...b, spent: b.spent + newTx.amount };
        }
        return b;
      });
      setLocalData('budgets', updatedBudgets);
    }

    return newTx;
  },
  deleteTransaction: async (id) => {
    const current = getLocalData('transactions', INITIAL_TRANSACTIONS);
    const target = current.find((t) => t._id === id);
    const updated = current.filter((t) => t._id !== id);
    setLocalData('transactions', updated);

    // Reverse wallet balance on delete
    if (target && target.walletId) {
      const wallets = getLocalData('wallets', INITIAL_WALLETS);
      const updatedWallets = wallets.map((w) => {
        if (w._id === target.walletId) {
          const delta = target.type === 'income' ? -target.amount : target.amount;
          return { ...w, balance: w.balance + delta };
        }
        return w;
      });
      setLocalData('wallets', updatedWallets);
    }

    return true;
  },

  // Budgets
  getBudgets: async () => {
    const res = await apiRequest('/budgets');
    return res?.budgets || getLocalData('budgets', INITIAL_BUDGETS);
  },
  createBudget: async (budgetData) => {
    const current = getLocalData('budgets', INITIAL_BUDGETS);
    const newBudget = {
      _id: 'b_' + Date.now(),
      spent: Number(budgetData.spent || 0),
      limit: Number(budgetData.limit || 10000),
      period: 'Monthly',
      alertThreshold: 85,
      ...budgetData
    };
    const updated = [...current, newBudget];
    setLocalData('budgets', updated);
    return newBudget;
  },
  deleteBudget: async (id) => {
    const current = getLocalData('budgets', INITIAL_BUDGETS);
    const updated = current.filter((b) => b._id !== id);
    setLocalData('budgets', updated);
    return true;
  },

  // Goals
  getGoals: async () => {
    const res = await apiRequest('/goals');
    return res?.goals || getLocalData('goals', INITIAL_GOALS);
  },
  createGoal: async (goalData) => {
    const current = getLocalData('goals', INITIAL_GOALS);
    const newGoal = {
      _id: 'g_' + Date.now(),
      currentAmount: Number(goalData.currentAmount || 0),
      targetAmount: Number(goalData.targetAmount || 100000),
      priority: 'Medium',
      ...goalData
    };
    const updated = [...current, newGoal];
    setLocalData('goals', updated);
    return newGoal;
  },
  contributeToGoal: async ({ goalId, walletId, amount }) => {
    const current = getLocalData('goals', INITIAL_GOALS);
    const numAmount = Number(amount);
    const updated = current.map((g) => {
      if (g._id === goalId) return { ...g, currentAmount: g.currentAmount + numAmount };
      return g;
    });
    setLocalData('goals', updated);

    // Deduct from wallet
    if (walletId) {
      const wallets = getLocalData('wallets', INITIAL_WALLETS);
      const updatedWallets = wallets.map((w) => {
        if (w._id === walletId) return { ...w, balance: w.balance - numAmount };
        return w;
      });
      setLocalData('wallets', updatedWallets);
    }

    return updated.find((g) => g._id === goalId);
  },

  // Recurring
  getRecurring: async () => {
    const res = await apiRequest('/recurring');
    return res?.recurring || getLocalData('recurring', INITIAL_RECURRING);
  },
  createRecurring: async (data) => {
    const current = getLocalData('recurring', INITIAL_RECURRING);
    const newItem = {
      _id: 'r_' + Date.now(),
      amount: Number(data.amount || 0),
      frequency: 'Monthly',
      autoProcess: true,
      ...data
    };
    const updated = [...current, newItem];
    setLocalData('recurring', updated);
    return newItem;
  },
  deleteRecurring: async (id) => {
    const current = getLocalData('recurring', INITIAL_RECURRING);
    const updated = current.filter((r) => r._id !== id);
    setLocalData('recurring', updated);
    return true;
  },

  // Reset to initial dummy data
  resetDemoData: () => {
    localStorage.clear();
    return true;
  }
};
