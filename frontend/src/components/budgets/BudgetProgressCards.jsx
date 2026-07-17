import React from 'react';
import { PieChart, AlertTriangle, CheckCircle2, Trash2, TrendingUp, Sparkles } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency, calculatePercentage } from '../../utils/formatters';

/**
 * Category Budget Progress Cards grid with smart thresholds and warning alerts
 */
const BudgetProgressCards = ({ onDelete }) => {
  const { budgets, selectedCurrency } = useFinanceData();

  if (budgets.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center text-slate-500">
        <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">No Active Budgets</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Create monthly or weekly spending limits for categories like Dining, Rent, or Shopping to prevent overspending.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {budgets.map((b) => {
        const perc = calculatePercentage(b.spent, b.limit);
        const isOver = b.spent > b.limit;
        const isWarning = !isOver && perc >= (b.alertThreshold || 80);

        const getStatusBadge = () => {
          if (isOver) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Over Budget (+{Math.round(perc - 100)}%)
              </span>
            );
          }
          if (isWarning) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Near Limit ({perc}%)
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              On Track ({perc}%)
            </span>
          );
        };

        const getBarColor = () => {
          if (isOver) return 'bg-gradient-to-r from-red-500 to-rose-600';
          if (isWarning) return 'bg-gradient-to-r from-amber-500 to-orange-500';
          return 'bg-gradient-to-r from-indigo-500 to-primary-600';
        };

        return (
          <div
            key={b._id}
            className="glass-card rounded-3xl p-6 flex flex-col justify-between relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Top info */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{b.category}</h3>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{b.period || 'Monthly'} Limit</span>
                </div>
                {getStatusBadge()}
              </div>

              {/* Progress Bar Container */}
              <div className="mt-5 space-y-2">
                <div className="flex items-baseline justify-between text-sm font-semibold">
                  <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                    Spent: {formatCurrency(b.spent, selectedCurrency)}
                  </span>
                  <span className="text-slate-400 text-xs">
                    Limit: {formatCurrency(b.limit, selectedCurrency)}
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    style={{ width: `${Math.min(perc, 100)}%` }}
                    className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor()}`}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Insight & Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate max-w-[170px]">
                  {isOver
                    ? `Reduce spend on ${b.category} by ₹${b.spent - b.limit}`
                    : `Remaining buffer: ${formatCurrency(Math.max(0, b.limit - b.spent), selectedCurrency)}`}
                </span>
              </div>

              <button
                onClick={() => onDelete(b._id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-80 group-hover:opacity-100"
                title="Remove budget limit"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BudgetProgressCards;
