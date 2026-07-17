import React from 'react';
import { PlusCircle, ArrowUpRight, ArrowDownRight, ArrowLeftRight, PieChart, Target } from 'lucide-react';

/**
 * Quick Action Button bar for instant modal triggers
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
      color: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/60',
      iconBg: 'bg-rose-500 text-white',
      onClick: onAddExpense
    },
    {
      label: 'Add Income',
      icon: ArrowUpRight,
      color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/60',
      iconBg: 'bg-emerald-500 text-white',
      onClick: onAddIncome
    },
    {
      label: 'Transfer Funds',
      icon: ArrowLeftRight,
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/60',
      iconBg: 'bg-blue-500 text-white',
      onClick: onTransfer
    },
    {
      label: 'Set Budget',
      icon: PieChart,
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200/60',
      iconBg: 'bg-purple-500 text-white',
      onClick: onAddBudget
    },
    {
      label: 'Create Goal',
      icon: Target,
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/60',
      iconBg: 'bg-indigo-500 text-white',
      onClick: onAddGoal
    }
  ];

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 tracking-tight">
          <PlusCircle className="w-4 h-4 text-indigo-600" />
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
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0 ${act.iconBg}`}>
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
