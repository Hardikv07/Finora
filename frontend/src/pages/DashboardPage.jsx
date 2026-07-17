import React, { useState } from 'react';
import StatCards from '../components/dashboard/StatCards';
import FinancialHealthCard from '../components/dashboard/FinancialHealthCard';
import QuickActions from '../components/dashboard/QuickActions';
import MonthlyCashFlowChart from '../components/dashboard/MonthlyCashFlowChart';
import RecentTransactionsList from '../components/dashboard/RecentTransactionsList';
import TransactionFormModal from '../components/transactions/TransactionFormModal';
import TransferModal from '../components/wallets/TransferModal';
import BudgetFormModal from '../components/budgets/BudgetFormModal';
import GoalFormModal from '../components/goals/GoalFormModal';

/**
 * Dashboard Page - Main central command hub
 */
const DashboardPage = ({ onNavigate }) => {
  const [modalType, setModalType] = useState(null); // 'expense' | 'income' | 'transfer' | 'budget' | 'goal' | null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Quick Actions Bar */}
      <QuickActions
        onAddExpense={() => setModalType('expense')}
        onAddIncome={() => setModalType('income')}
        onTransfer={() => setModalType('transfer')}
        onAddBudget={() => setModalType('budget')}
        onAddGoal={() => setModalType('goal')}
      />

      {/* Metric Stat Cards */}
      <StatCards />

      {/* Middle Grid: Cash Flow Chart + Financial Health Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyCashFlowChart />
        </div>
        <div>
          <FinancialHealthCard />
        </div>
      </div>

      {/* Recent Transactions Table */}
      <RecentTransactionsList onViewAll={() => onNavigate && onNavigate('transactions')} />

      {/* Modals triggered by Quick Actions */}
      <TransactionFormModal
        isOpen={modalType === 'expense' || modalType === 'income'}
        onClose={() => setModalType(null)}
        initialData={modalType === 'expense' ? { type: 'expense' } : modalType === 'income' ? { type: 'income' } : null}
      />

      <TransferModal
        isOpen={modalType === 'transfer'}
        onClose={() => setModalType(null)}
      />

      <BudgetFormModal
        isOpen={modalType === 'budget'}
        onClose={() => setModalType(null)}
      />

      <GoalFormModal
        isOpen={modalType === 'goal'}
        onClose={() => setModalType(null)}
      />
    </div>
  );
};

export default DashboardPage;
