import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useToast } from './useToast';

const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');

  // Load initial data
  const refreshAllData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [uData, wData, tData, bData, gData, rData] = await Promise.all([
        apiService.getUserProfile(),
        apiService.getWallets(),
        apiService.getTransactions(),
        apiService.getBudgets(),
        apiService.getGoals(),
        apiService.getRecurring()
      ]);

      setUser(uData);
      setWallets(wData);
      setTransactions(tData);
      setBudgets(bData);
      setGoals(gData);
      setRecurring(rData);
      if (uData?.currency) setSelectedCurrency(uData.currency);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      addToast({ title: 'Data Load Warning', message: 'Using local offline engine data.', type: 'info' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    refreshAllData(true);
  }, [refreshAllData]);

  // Transaction Actions
  const addTransaction = async (txData) => {
    try {
      const created = await apiService.createTransaction(txData);
      setTransactions((prev) => [created, ...prev]);
      // Update wallet if linked
      if (txData.walletId) {
        const wList = await apiService.getWallets();
        setWallets(wList);
      }
      // Update budgets if expense
      if (txData.type === 'expense') {
        const bList = await apiService.getBudgets();
        setBudgets(bList);
      }
      addToast({
        title: 'Transaction Recorded',
        message: `Successfully logged ${txData.type}: ₹${txData.amount}`,
        type: 'success'
      });
      return created;
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to add transaction.', type: 'error' });
      throw err;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await apiService.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      const wList = await apiService.getWallets();
      setWallets(wList);
      addToast({ title: 'Removed', message: 'Transaction successfully deleted.', type: 'info' });
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to delete transaction.', type: 'error' });
    }
  };

  // Wallet Actions
  const addWallet = async (walletData) => {
    try {
      const created = await apiService.createWallet(walletData);
      setWallets((prev) => [created, ...prev]);
      addToast({ title: 'Wallet Added', message: `${created.name} created successfully!`, type: 'success' });
      return created;
    } catch (err) {
      addToast({ title: 'Error', message: 'Could not create wallet.', type: 'error' });
    }
  };

  const deleteWallet = async (id) => {
    try {
      await apiService.deleteWallet(id);
      setWallets((prev) => prev.filter((w) => w._id !== id));
      addToast({ title: 'Wallet Removed', message: 'Wallet deleted successfully.', type: 'info' });
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to remove wallet.', type: 'error' });
    }
  };

  const transferFunds = async ({ fromWalletId, toWalletId, amount }) => {
    try {
      await apiService.transferFunds({ fromWalletId, toWalletId, amount });
      const wList = await apiService.getWallets();
      setWallets(wList);
      addToast({ title: 'Transfer Complete', message: `Successfully transferred ₹${amount} across wallets.`, type: 'success' });
    } catch (err) {
      addToast({ title: 'Transfer Failed', message: 'Could not complete transfer.', type: 'error' });
    }
  };

  // Budget Actions
  const addBudget = async (budgetData) => {
    try {
      const created = await apiService.createBudget(budgetData);
      setBudgets((prev) => [...prev, created]);
      addToast({ title: 'Budget Set', message: `Budget limit for ${created.category} created!`, type: 'success' });
      return created;
    } catch (err) {
      addToast({ title: 'Error', message: 'Could not create budget.', type: 'error' });
    }
  };

  const deleteBudget = async (id) => {
    try {
      await apiService.deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b._id !== id));
      addToast({ title: 'Budget Removed', message: 'Category limit deleted.', type: 'info' });
    } catch (err) {
      addToast({ title: 'Error', message: 'Could not remove budget.', type: 'error' });
    }
  };

  // Goal Actions
  const addGoal = async (goalData) => {
    try {
      const created = await apiService.createGoal(goalData);
      setGoals((prev) => [...prev, created]);
      addToast({ title: 'Goal Created', message: `${created.title} added to tracking!`, type: 'success' });
      return created;
    } catch (err) {
      addToast({ title: 'Error', message: 'Could not create goal.', type: 'error' });
    }
  };

  const contributeGoal = async ({ goalId, walletId, amount }) => {
    try {
      await apiService.contributeToGoal({ goalId, walletId, amount });
      const [gList, wList] = await Promise.all([apiService.getGoals(), apiService.getWallets()]);
      setGoals(gList);
      setWallets(wList);
      addToast({ title: 'Contribution Made', message: `Added ₹${amount} to your savings goal!`, type: 'success' });
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to contribute to goal.', type: 'error' });
    }
  };

  // Recurring Actions
  const addRecurring = async (data) => {
    try {
      const created = await apiService.createRecurring(data);
      setRecurring((prev) => [...prev, created]);
      addToast({ title: 'Subscription Added', message: `${created.title} recurring item created.`, type: 'success' });
      return created;
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to add recurring item.', type: 'error' });
    }
  };

  const deleteRecurring = async (id) => {
    try {
      await apiService.deleteRecurring(id);
      setRecurring((prev) => prev.filter((r) => r._id !== id));
      addToast({ title: 'Removed', message: 'Recurring item cancelled.', type: 'info' });
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to delete recurring item.', type: 'error' });
    }
  };

  const resetData = async () => {
    apiService.resetDemoData();
    await refreshAllData(true);
    addToast({ title: 'Demo Reset', message: 'All dummy data restored to default state.', type: 'info' });
  };

  return (
    <FinanceContext.Provider
      value={{
        loading,
        user,
        wallets,
        transactions,
        budgets,
        goals,
        recurring,
        selectedCurrency,
        setSelectedCurrency,
        refreshAllData,
        addTransaction,
        deleteTransaction,
        addWallet,
        deleteWallet,
        transferFunds,
        addBudget,
        deleteBudget,
        addGoal,
        contributeGoal,
        addRecurring,
        deleteRecurring,
        resetData
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export default FinanceProvider;

export const useFinanceData = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinanceData must be used within a FinanceProvider');
  }
  return context;
};
