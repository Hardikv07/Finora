import React, { useState } from 'react';
import { Plus, PieChart as PieIcon, Sparkles } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { formatCurrency } from '../utils/formatters';
import Button from '../components/common/Button';
import BudgetProgressCards from '../components/budgets/BudgetProgressCards';
import BudgetFormModal from '../components/budgets/BudgetFormModal';

/**
 * Budgets Page - Category spending limits and warnings
 */
const BudgetsPage = () => {
  const { budgets, deleteBudget, selectedCurrency } = useFinanceData();
  const [modalOpen, setModalOpen] = useState(false);

  const totalLimit = budgets.reduce((acc, b) => acc + (Number(b.limit) || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (Number(b.spent) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Category Budget System</h2>
          <p className="text-xs text-slate-500 mt-0.5">Establish spending boundaries and automatic thresholds for every expense category</p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
          Set New Budget
        </Button>
      </div>

      {/* Overview Banner */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <PieIcon className="w-7 h-7 text-indigo-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Overall Monthly Budget Health</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              You have used <strong className="text-white">{totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0}%</strong> of your aggregate category budget ceiling.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-white/10">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Total Spent</span>
            <span className="text-2xl font-black text-rose-400">
              {formatCurrency(totalSpent, selectedCurrency)}
            </span>
          </div>

          <div className="h-10 w-px bg-white/20 hidden sm:block" />

          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Total Ceiling</span>
            <span className="text-2xl font-black text-white">
              {formatCurrency(totalLimit, selectedCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* AI Smart Suggestion Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-between gap-4 text-xs font-medium text-indigo-950">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>
            <strong>FinPulse AI Recommendation:</strong> Based on the last 6 months, we suggest raising your <em>Food & Dining</em> budget by ₹2,000 to avoid late-month threshold warnings.
          </span>
        </div>
      </div>

      {/* Budget Cards Grid */}
      <BudgetProgressCards onDelete={deleteBudget} />

      {/* Modal */}
      <BudgetFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default BudgetsPage;
