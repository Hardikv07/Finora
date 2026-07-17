import React from 'react';
import { Target, Calendar, PlusCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency, formatDate, calculatePercentage } from '../../utils/formatters';

/**
 * Goal Cards grid showing target amount, current progress, deadline, and quick contribute button
 */
const GoalCards = ({ onContribute }) => {
  const { goals, selectedCurrency } = useFinanceData();

  if (goals.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center text-slate-500">
        <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">No Financial Goals Set</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Create milestones for purchasing a vehicle, building an emergency fund, or planning vacations.
        </p>
      </div>
    );
  }

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'High':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Medium':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goals.map((g) => {
        const perc = calculatePercentage(g.currentAmount, g.targetAmount);
        const isCompleted = g.currentAmount >= g.targetAmount;

        return (
          <div
            key={g._id}
            className="glass-card rounded-3xl p-6 flex flex-col justify-between relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div>
              {/* Header: Title + Priority */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-base truncate">{g.title}</h3>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Target: {formatDate(g.deadline)}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${getPriorityBadge(g.priority)}`}>
                  {g.priority || 'Medium'} Priority
                </span>
              </div>

              {/* Progress Ring & Numbers */}
              <div className="mt-6 flex items-center gap-5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="24" stroke="currentColor" strokeWidth="6" className="text-slate-200" fill="transparent" />
                    <circle
                      cx="30"
                      cy="30"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={(2 * Math.PI * 24) * (1 - Math.min(perc, 100) / 100)}
                      strokeLinecap="round"
                      className={isCompleted ? 'text-emerald-500' : 'text-indigo-600'}
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800">
                    {perc}%
                  </span>
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Saved Pool</p>
                  <p className="text-lg font-black text-slate-900 truncate">
                    {formatCurrency(g.currentAmount, selectedCurrency)}
                  </p>
                  <p className="text-xs text-slate-500">
                    of {formatCurrency(g.targetAmount, selectedCurrency)} goal
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Insight / Action */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">
                  {isCompleted
                    ? 'Goal Fully Achieved! 🎉'
                    : `Remaining: ${formatCurrency(Math.max(0, g.targetAmount - g.currentAmount), selectedCurrency)}`}
                </span>
              </div>

              <button
                onClick={() => onContribute(g)}
                disabled={isCompleted}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 active:scale-95"
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Contribute</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GoalCards;
