import React, { useState } from 'react';
import { Plus, PieChart as PieIcon } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { formatCurrency } from '../utils/formatters';
import BudgetProgressCards from '../components/budgets/BudgetProgressCards';
import BudgetFormModal from '../components/budgets/BudgetFormModal';
import Button from '../components/common/Button';

/**
 * Budget System Page in crisp Dark Palette
 */
const BudgetsPage = () => {
  const { budgets, selectedCurrency } = useFinanceData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const handleOpenEdit = (b) => {
    setEditingBudget(b);
    setModalOpen(true);
  };

  const totalLimit = budgets.reduce((acc, b) => acc + (Number(b.limit) || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (Number(b.spent) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Category Budget System</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Establish spending boundaries and automatic thresholds for every expense category</p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditingBudget(null); setModalOpen(true); }}>
          Set New Budget
        </Button>
      </div>

      {/* Overview Banner */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-[#1c1c22] via-[#24242e] to-[#1c1c22] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border-[#2e2e36]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#3b231c] border border-[#543025] flex items-center justify-center shrink-0">
            <PieIcon className="w-7 h-7 text-[#ea9d85]" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Overall Monthly Budget Health</h3>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              You have used <strong className="text-[#ea9d85]">{totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0}%</strong> of your aggregate category budget ceiling.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-[#2e2e36]">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Spent</span>
            <span className="text-2xl font-black text-[#f87171]">
              {formatCurrency(totalSpent, selectedCurrency)}
            </span>
          </div>

          <div className="h-10 w-px bg-[#2e2e36] hidden sm:block" />

          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Ceiling</span>
            <span className="text-2xl font-black text-white">
              {formatCurrency(totalLimit, selectedCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Category Progress Cards Grid */}
      <BudgetProgressCards onEdit={handleOpenEdit} />

      {/* Budget Modal */}
      <BudgetFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingBudget}
      />
    </div>
  );
};

export default BudgetsPage;
