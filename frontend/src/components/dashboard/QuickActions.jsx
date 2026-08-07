import React from 'react';
import { PlusCircle, ArrowUpRight, ArrowDownRight, ArrowLeftRight, PieChart, Target } from 'lucide-react';

/**
 * Quick Action Button bar matching the user's reference dark UI theme
 */
const QuickActions = ({
  onAddExpense,
  onAddIncome,
  onTransfer,
  onAddBudget,
  onAddGoal
}) => {
  const actions = [
    {
      label: 'Add Expense',
      icon: ArrowDownRight,
      color: 'bg-[#281b1d] hover:bg-[#382024] text-[#f87171] border-[#4a2428]',
      iconBg: 'bg-[#f87171] text-slate-950',
      onClick: onAddExpense
    },
    {
      label: 'Add Income',
      icon: ArrowUpRight,
      color: 'bg-[#1d2622] hover:bg-[#23332c] text-[#86c8a7] border-[#293d33]',
      iconBg: 'bg-[#86c8a7] text-slate-950',
      onClick: onAddIncome
    },
    {
      label: 'Transfer Funds',
      icon: ArrowLeftRight,
      color: 'bg-[#1e222a] hover:bg-[#262c38] text-[#93b4ed] border-[#2b3547]',
      iconBg: 'bg-[#93b4ed] text-slate-950',
      onClick: onTransfer
    },
    {
      label: 'Set Budget',
      icon: PieChart,
      color: 'bg-[#22202a] hover:bg-[#2b2738] text-[#b09cec] border-[#36304a]',
      iconBg: 'bg-[#b09cec] text-slate-950',
      onClick: onAddBudget
    },
    {
      label: 'Create Goal',
      icon: Target,
      color: 'bg-[#2e1f1a] hover:bg-[#3b2720] text-[#ea9d85] border-[#4a2b22]',
      iconBg: 'bg-[#ea9d85] text-slate-950',
      onClick: onAddGoal
    }
  ];

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
          <PlusCircle className="w-4 h-4 text-[#ea9d85]" />
          Quick Financial Actions
        </h3>
        <span className="text-xs text-slate-400 font-medium hidden sm:block">One-click operations</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              onClick={act.onClick}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 font-semibold text-xs text-left active:scale-[0.98] ${act.color}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0 font-bold ${act.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
