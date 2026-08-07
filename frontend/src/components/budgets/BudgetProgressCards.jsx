import React from 'react';
import { Sparkles, Edit3, Trash2 } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency } from '../../utils/formatters';

/**
 * Category Budget Progress Cards in High-Contrast Dark Theme
 */
const BudgetProgressCards = ({ onEdit }) => {
  const { budgets, deleteBudget, selectedCurrency } = useFinanceData();

  if (budgets.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-slate-400">
        <p className="font-bold text-lg text-white">No category budgets defined.</p>
        <p className="text-xs text-slate-400 mt-1">Set expense ceilings to receive warning alerts before overspending.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {budgets.map((b) => {
        const perc = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
        const isOver = b.spent > b.limit;
        const isWarning = perc >= (b.alertThreshold || 80) && !isOver;

        const getStatusBadge = () => {
          if (isOver) {
            return (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                Over Budget (+{perc - 100}%)
              </span>
            );
          }
          if (isWarning) {
            return (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#3b231c] text-[#ea9d85] border border-[#543025]">
                {perc}% Used (Near Limit)
              </span>
            );
          }
          return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1d2622] text-[#86c8a7] border border-[#293d33]">
              {perc}% Used (Safe)
            </span>
          );
        };

        const getBarColor = () => {
          if (isOver) return 'bg-gradient-to-r from-rose-500 to-red-600';
          if (isWarning) return 'bg-gradient-to-r from-[#d96b43] to-[#ea9d85]';
          return 'bg-gradient-to-r from-[#86c8a7] to-emerald-500';
        };

        return (
          <div
            key={b._id}
            className="glass-card rounded-3xl p-6 flex flex-col justify-between relative group transition-all duration-300 hover:-translate-y-1"
          >
            {/* Top info */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-base">{b.category}</h3>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{b.period || 'Monthly'} Limit</span>
                </div>
                {getStatusBadge()}
              </div>

              {/* Progress Bar Container */}
              <div className="mt-5 space-y-2">
                <div className="flex items-baseline justify-between text-sm font-semibold">
                  <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                    Spent: {formatCurrency(b.spent, selectedCurrency)}
                  </span>
                  <span className="text-slate-400 text-xs">
                    Limit: {formatCurrency(b.limit, selectedCurrency)}
                  </span>
                </div>

                <div className="w-full h-3 bg-[#141416] rounded-full overflow-hidden p-0.5 border border-[#2e2e36]">
                  <div
                    style={{ width: `${Math.min(perc, 100)}%` }}
                    className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor()}`}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Insight & Actions */}
            <div className="mt-6 pt-4 border-t border-[#2e2e36] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#ea9d85] shrink-0" />
                <span>
                  {isOver
                    ? 'Ceiling exceeded by ' + formatCurrency(b.spent - b.limit, selectedCurrency)
                    : formatCurrency(b.limit - b.spent, selectedCurrency) + ' remaining'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(b)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#282832] transition-colors"
                    title="Edit budget limit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteBudget(b._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove budget"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BudgetProgressCards;
