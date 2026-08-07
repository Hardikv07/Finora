import React from 'react';
import { Target, Calendar, PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Savings Goals Cards Component in High-Contrast Dark Palette
 */
const GoalCards = ({ onContribute }) => {
  const { goals, deleteGoal, selectedCurrency } = useFinanceData();

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Med':
        return 'bg-[#3b231c] text-[#ea9d85] border-[#543025]';
      case 'Low':
        return 'bg-[#1d2622] text-[#86c8a7] border-[#293d33]';
      default:
        return 'bg-[#22222a] text-slate-300 border-[#383844]';
    }
  };

  if (goals.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-slate-400">
        <p className="font-bold text-lg text-white">No savings goals created yet.</p>
        <p className="text-xs text-slate-400 mt-1">Start tracking your dream purchases and emergency funds.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goals.map((g) => {
        const perc = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
        const isCompleted = g.isCompleted || perc >= 100;

        return (
          <div
            key={g._id}
            className="glass-card rounded-3xl p-6 flex flex-col justify-between relative group transition-all duration-300 hover:-translate-y-1"
          >
            <div>
              {/* Header: Title + Priority */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#d96b43] to-[#ea9d85] flex items-center justify-center text-white shadow-md shrink-0 font-bold">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-base truncate">{g.title}</h3>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Target: {formatDate(g.deadline)}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${getPriorityBadge(g.priority)}`}>
                  {g.priority || 'Medium'}
                </span>
              </div>

              {/* Progress Ring & Numbers */}
              <div className="mt-6 flex items-center gap-5 bg-[#141416] p-4 rounded-2xl border border-[#2e2e36]">
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="24" stroke="#2e2e36" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="30"
                      cy="30"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={(2 * Math.PI * 24) * (1 - Math.min(perc, 100) / 100)}
                      strokeLinecap="round"
                      className={isCompleted ? 'text-[#86c8a7]' : 'text-[#ea9d85]'}
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
                    {perc}%
                  </span>
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Saved Pool</p>
                  <p className="text-lg font-black text-white truncate">
                    {formatCurrency(g.currentAmount, selectedCurrency)}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    of {formatCurrency(g.targetAmount, selectedCurrency)} goal
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-[#2e2e36] flex items-center justify-between gap-3">
              {isCompleted ? (
                <div className="flex items-center gap-1.5 text-[#86c8a7] font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Goal Achieved!</span>
                </div>
              ) : (
                <button
                  onClick={() => onContribute(g)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#ea9d85] hover:text-[#d96b43] transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Deposit Funds</span>
                </button>
              )}

              <button
                onClick={() => deleteGoal(g._id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete goal"
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

export default GoalCards;
