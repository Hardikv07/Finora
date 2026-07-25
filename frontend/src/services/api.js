import {
  INITIAL_USER,
  INITIAL_WALLETS,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
  INITIAL_RECURRING
} from '../constants/dummyData';

/**
 * API Base URL Strategy:
 *
 * DEVELOPMENT  → '/api'
 *   Vite dev server proxies all /api/* requests to http://localhost:7777.
 *   Because the request appears same-origin to the browser, httpOnly cookies
 *   are sent automatically. We also pass credentials:'include' for production parity.
 *
 * PRODUCTION   → import.meta.env.VITE_API_URL  (set in .env or hosting dashboard)
 *   e.g. 'https://api.finora.app/api'
 *
 * Never hardcode 'http://localhost:XXXX' anywhere in this file.
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ─── LocalStorage Helpers ────────────────────────────────────────────────────

/** Namespace prefix prevents collisions with other libs that use localStorage. */
const LS_PREFIX = 'finora_';

const getLocalData = (key, initialValue) => {
  try {
    const item = localStorage.getItem(`${LS_PREFIX}${key}`);
    if (!item) {
      localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(initialValue));
      return initialValue;
    }
    return JSON.parse(item);
  } catch {
    return initialValue;
  }
};

const setLocalData = (key, value) => {
  try {
    localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`[Finora] Failed to persist "${key}" to localStorage`, e);
  }
};

// ─── HTTP Client ─────────────────────────────────────────────────────────────

/**
 * Generic fetch wrapper.
 *
 * Returns the parsed JSON body on success.
 * Returns null on network failure / timeout so callers can fall back to
 * cached localStorage data gracefully.
 *
 * Auth strategy (dual-mode):
 *   1. httpOnly cookie (`credentials: 'include'`) — set by the backend on login.
 *      Works when Vite proxy is active (same-origin from browser's perspective).
 *   2. Authorization: Bearer header — read from `finora_auth_token` in localStorage.
 *      Acts as a fallback and guarantees auth even if cookies aren't forwarded.
 *   The backend auth middleware checks BOTH — whichever arrives first wins.
 *
 * @param {string}      endpoint  - Path relative to BASE_URL, e.g. '/wallets'
 * @param {string}      method    - HTTP verb (default 'GET')
 * @param {object|null} body      - JSON body for POST/PUT requests
 * @param {number}      timeoutMs - Abort after this many ms (default 8000)
 */
const apiRequest = async (endpoint, method = 'GET', body = null, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = { 'Content-Type': 'application/json' };

    // Attach Bearer token if available — backend middleware accepts both cookie and header
    const storedToken = localStorage.getItem('finora_auth_token');
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }

    const options = {
      method,
      headers,
      credentials: 'include', // Also send httpOnly cookies when on same origin
      signal: controller.signal,
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name !== 'AbortError') {
      console.warn(`[Finora API] ${method} ${endpoint} failed:`, error.message);
    }
    return null;
  }
};


// ─── API Service ─────────────────────────────────────────────────────────────

export const apiService = {

  // ── User Profile ──────────────────────────────────────────────────────────
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

  // ── Wallets ───────────────────────────────────────────────────────────────
  getWallets: async () => {
    const res = await apiRequest('/wallets');
    return res?.wallets || getLocalData('wallets', INITIAL_WALLETS);
  },

  createWallet: async (walletData) => {
    const res = await apiRequest('/wallets', 'POST', walletData);
    if (res?.wallet) {
      const current = getLocalData('wallets', INITIAL_WALLETS);
      setLocalData('wallets', [res.wallet, ...current]);
      return res.wallet;
    }
    // Offline fallback
    const current = getLocalData('wallets', INITIAL_WALLETS);
    const newWallet = {
      _id: `w_${Date.now()}`,
      balance: Number(walletData.balance || 0),
      color: 'from-blue-600 to-indigo-700',
      ...walletData,
    };
    setLocalData('wallets', [newWallet, ...current]);
    return newWallet;
  },

  updateWallet: async (id, walletData) => {
    const res = await apiRequest(`/wallets/${id}`, 'PUT', walletData);
    if (res?.wallet) {
      const current = getLocalData('wallets', INITIAL_WALLETS);
      setLocalData('wallets', current.map((w) => (w._id === id ? res.wallet : w)));
      return res.wallet;
    }
    // Offline fallback
    const current = getLocalData('wallets', INITIAL_WALLETS);
    const updated = current.map((w) =>
      w._id === id
        ? { ...w, ...walletData, balance: Number(walletData.balance ?? w.balance) }
        : w
    );
    setLocalData('wallets', updated);
    return updated.find((w) => w._id === id);
  },

  deleteWallet: async (id) => {
    await apiRequest(`/wallets/${id}`, 'DELETE');
    const current = getLocalData('wallets', INITIAL_WALLETS);
    setLocalData('wallets', current.filter((w) => w._id !== id));
    return true;
  },

  transferFunds: async ({ fromWalletId, toWalletId, amount, notes }) => {
    const res = await apiRequest('/wallets/transfer', 'POST', {
      fromWalletId, toWalletId, amount, notes,
    });
    if (res) return res;
    // Offline fallback
    const current = getLocalData('wallets', INITIAL_WALLETS);
    const numAmount = Number(amount);
    const updated = current.map((w) => {
      if (w._id === fromWalletId) return { ...w, balance: w.balance - numAmount };
      if (w._id === toWalletId)   return { ...w, balance: w.balance + numAmount };
      return w;
    });
    setLocalData('wallets', updated);
    return updated;
  },

  // ── Transactions ──────────────────────────────────────────────────────────
  getTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await apiRequest(`/transactions${query ? `?${query}` : ''}`);
    return res?.transactions || getLocalData('transactions', INITIAL_TRANSACTIONS);
  },

  createTransaction: async (txData) => {
    const res = await apiRequest('/transactions', 'POST', txData);
    if (res?.transaction) {
      const current = getLocalData('transactions', INITIAL_TRANSACTIONS);
      setLocalData('transactions', [res.transaction, ...current]);
      return res.transaction;
    }
    // Offline fallback
    const current = getLocalData('transactions', INITIAL_TRANSACTIONS);
    const newTx = {
      _id: `tx_${Date.now()}`,
      date: txData.date || new Date().toISOString(),
      amount: Number(txData.amount || 0),
      tags: typeof txData.tags === 'string'
        ? txData.tags.split(',').map((t) => t.trim())
        : (txData.tags || []),
      ...txData,
    };
    setLocalData('transactions', [newTx, ...current]);

    if (newTx.walletId) {
      const wallets = getLocalData('wallets', INITIAL_WALLETS);
      setLocalData('wallets', wallets.map((w) => {
        if (w._id !== newTx.walletId) return w;
        const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
        return { ...w, balance: w.balance + delta };
      }));
    }

    return newTx;
  },

  updateTransaction: async (id, txData) => {
    const res = await apiRequest(`/transactions/${id}`, 'PUT', txData);
    if (res?.transaction) {
      const current = getLocalData('transactions', INITIAL_TRANSACTIONS);
      setLocalData('transactions', current.map((t) => (t._id === id ? res.transaction : t)));
      return res.transaction;
    }
    // Offline fallback
    const current = getLocalData('transactions', INITIAL_TRANSACTIONS);
    const updated = current.map((t) => (t._id === id ? { ...t, ...txData } : t));
    setLocalData('transactions', updated);
    return updated.find((t) => t._id === id);
  },

  deleteTransaction: async (id) => {
    await apiRequest(`/transactions/${id}`, 'DELETE');
    const current = getLocalData('transactions', INITIAL_TRANSACTIONS);
    const target = current.find((t) => t._id === id);
    setLocalData('transactions', current.filter((t) => t._id !== id));

    if (target?.walletId) {
      const wallets = getLocalData('wallets', INITIAL_WALLETS);
      setLocalData('wallets', wallets.map((w) => {
        if (w._id !== target.walletId) return w;
        const delta = target.type === 'income' ? -target.amount : target.amount;
        return { ...w, balance: w.balance + delta };
      }));
    }
    return true;
  },

  // ── Budgets ───────────────────────────────────────────────────────────────
  getBudgets: async () => {
    const res = await apiRequest('/budgets');
    return res?.budgets || getLocalData('budgets', INITIAL_BUDGETS);
  },

  createBudget: async (budgetData) => {
    const res = await apiRequest('/budgets', 'POST', budgetData);
    if (res?.budget) {
      const current = getLocalData('budgets', INITIAL_BUDGETS);
      setLocalData('budgets', [...current, res.budget]);
      return res.budget;
    }
    // Offline fallback
    const current = getLocalData('budgets', INITIAL_BUDGETS);
    const newBudget = {
      _id: `b_${Date.now()}`,
      spent: Number(budgetData.spent || 0),
      limit: Number(budgetData.limit || 10000),
      period: 'Monthly',
      alertThreshold: 85,
      ...budgetData,
    };
    setLocalData('budgets', [...current, newBudget]);
    return newBudget;
  },

  deleteBudget: async (id) => {
    await apiRequest(`/budgets/${id}`, 'DELETE');
    const current = getLocalData('budgets', INITIAL_BUDGETS);
    setLocalData('budgets', current.filter((b) => b._id !== id));
    return true;
  },

  // ── Goals ─────────────────────────────────────────────────────────────────
  getGoals: async () => {
    const res = await apiRequest('/goals');
    return res?.goals || getLocalData('goals', INITIAL_GOALS);
  },

  createGoal: async (goalData) => {
    const res = await apiRequest('/goals', 'POST', goalData);
    if (res?.goal) {
      const current = getLocalData('goals', INITIAL_GOALS);
      setLocalData('goals', [...current, res.goal]);
      return res.goal;
    }
    // Offline fallback
    const current = getLocalData('goals', INITIAL_GOALS);
    const newGoal = {
      _id: `g_${Date.now()}`,
      currentAmount: Number(goalData.currentAmount || 0),
      targetAmount: Number(goalData.targetAmount || 100000),
      priority: 'Medium',
      ...goalData,
    };
    setLocalData('goals', [...current, newGoal]);
    return newGoal;
  },

  contributeToGoal: async ({ goalId, walletId, amount }) => {
    const res = await apiRequest(`/goals/${goalId}/contribute`, 'POST', { walletId, amount });
    if (res?.goal) {
      const current = getLocalData('goals', INITIAL_GOALS);
      setLocalData('goals', current.map((g) => (g._id === goalId ? res.goal : g)));
      return res.goal;
    }
    // Offline fallback
    const numAmount = Number(amount);
    const current = getLocalData('goals', INITIAL_GOALS);
    const updated = current.map((g) =>
      g._id === goalId ? { ...g, currentAmount: g.currentAmount + numAmount } : g
    );
    setLocalData('goals', updated);
    if (walletId) {
      const wallets = getLocalData('wallets', INITIAL_WALLETS);
      setLocalData('wallets', wallets.map((w) =>
        w._id === walletId ? { ...w, balance: w.balance - numAmount } : w
      ));
    }
    return updated.find((g) => g._id === goalId);
  },

  // ── Recurring ─────────────────────────────────────────────────────────────
  getRecurring: async () => {
    const res = await apiRequest('/recurring');
    return res?.recurring || getLocalData('recurring', INITIAL_RECURRING);
  },

  createRecurring: async (data) => {
    const res = await apiRequest('/recurring', 'POST', data);
    if (res?.recurring) {
      const current = getLocalData('recurring', INITIAL_RECURRING);
      setLocalData('recurring', [...current, res.recurring]);
      return res.recurring;
    }
    // Offline fallback
    const current = getLocalData('recurring', INITIAL_RECURRING);
    const newItem = {
      _id: `r_${Date.now()}`,
      amount: Number(data.amount || 0),
      frequency: 'Monthly',
      autoProcess: true,
      ...data,
    };
    setLocalData('recurring', [...current, newItem]);
    return newItem;
  },

  deleteRecurring: async (id) => {
    await apiRequest(`/recurring/${id}`, 'DELETE');
    const current = getLocalData('recurring', INITIAL_RECURRING);
    setLocalData('recurring', current.filter((r) => r._id !== id));
    return true;
  },

  // ── Bills ─────────────────────────────────────────────────────────────────
  getBills: async () => {
    const res = await apiRequest('/bills');
    if (res?.bills) return res.bills;
    return getLocalData('bills', []);
  },

  createBill: async (billData) => {
    const res = await apiRequest('/bills', 'POST', billData);
    if (res?.bill) {
      const current = getLocalData('bills', []);
      setLocalData('bills', [res.bill, ...current]);
      return res.bill;
    }
    // Offline fallback
    const current = getLocalData('bills', []);
    const newBill = {
      _id: `bill_${Date.now()}`,
      status: billData.status || 'PENDING',
      paymentHistory: [],
      createdAt: new Date().toISOString(),
      ...billData,
    };
    setLocalData('bills', [newBill, ...current]);
    return newBill;
  },

  updateBill: async (id, billData) => {
    const res = await apiRequest(`/bills/${id}`, 'PUT', billData);
    if (res?.bill) {
      const current = getLocalData('bills', []);
      setLocalData('bills', current.map((b) => (b._id === id ? res.bill : b)));
      return res.bill;
    }
    // Offline fallback
    const current = getLocalData('bills', []);
    const updated = current.map((b) => (b._id === id ? { ...b, ...billData } : b));
    setLocalData('bills', updated);
    return updated.find((b) => b._id === id);
  },

  deleteBill: async (id) => {
    await apiRequest(`/bills/${id}`, 'DELETE');
    const current = getLocalData('bills', []);
    setLocalData('bills', current.filter((b) => b._id !== id));
    return true;
  },

  // ── Bill Parsing (AI + OCR) ───────────────────────────────────────────────
  /**
   * Upload a receipt file to the backend for server-side AI extraction.
   * Returns { merchant, amount, date, category } or null on failure.
   * Note: Do NOT set Content-Type manually for FormData — the browser handles it.
   */
  parseBillFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const response = await fetch(`${BASE_URL}/transactions/parse-bill`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },

  /**
   * Parse OCR text extracted client-side using the Gemini AI backend.
   */
  parseOcrText: async (ocrText) => {
    const res = await apiRequest('/transactions/parse-ocr', 'POST', { ocrText }, 20000);
    return res?.extracted || null;
  },

  // ── Search ────────────────────────────────────────────────────────────────
  getSearchSuggestions: async (query) => {
    const res = await apiRequest(`/search/suggestions?q=${encodeURIComponent(query)}`);
    let suggestions = res?.suggestions || [];

    if (suggestions.length === 0 && query.trim()) {
      const localTxs = getLocalData('transactions', INITIAL_TRANSACTIONS);
      const q = query.toLowerCase();
      const seen = new Set();
      localTxs.forEach((tx) => {
        if (tx.merchant?.toLowerCase().includes(q)) seen.add(tx.merchant);
        if (tx.category?.toLowerCase().includes(q)) seen.add(tx.category);
        tx.tags?.forEach((tag) => { if (tag.toLowerCase().includes(q)) seen.add(tag); });
      });
      suggestions = Array.from(seen).slice(0, 10);
    }
    return suggestions;
  },

  searchTransactions: async (query) => {
    const res = await apiRequest(`/search/transactions?q=${encodeURIComponent(query)}`);
    let txs = res?.transactions || [];

    if (txs.length === 0 && query.trim()) {
      const localTxs = getLocalData('transactions', INITIAL_TRANSACTIONS);
      const q = query.toLowerCase();
      txs = localTxs.filter((tx) =>
        tx.merchant?.toLowerCase().includes(q) ||
        tx.category?.toLowerCase().includes(q) ||
        tx.notes?.toLowerCase().includes(q) ||
        tx.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return txs;
  },

  // ── Demo Reset ────────────────────────────────────────────────────────────
  /**
   * Reset only Finora's own localStorage keys (prefixed with 'finora_').
   * Does NOT call localStorage.clear() to avoid wiping unrelated browser storage
   * such as other apps' tokens or Google Sign-In state.
   */
  resetDemoData: () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(LS_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
    return true;
  },

  // ── Finora Copilot ────────────────────────────────────────────────────────
  /**
   * Send a message to the Finora AI Copilot.
   * Uses BASE_URL — no separate hardcoded URL.
   */
  copilotChat: async (message, history = []) => {
    const headers = { 'Content-Type': 'application/json' };

    // Attach Bearer token — required since this is a direct fetch(), not apiRequest()
    const storedToken = localStorage.getItem('finora_auth_token');
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }

    const response = await fetch(`${BASE_URL}/copilot/chat`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Copilot error (${response.status})`);
    }

    return response.json();
  },
};
