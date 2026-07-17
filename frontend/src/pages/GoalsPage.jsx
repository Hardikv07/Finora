import React, { useState } from 'react';
import { Plus, Target, Sparkles } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { formatCurrency } from '../utils/formatters';
import Button from '../components/common/Button';
import GoalCards from '../components/goals/GoalCards';
import GoalFormModal from '../components/goals/GoalFormModal';
import ContributeModal from '../components/goals/ContributeModal';

/**
 * Goals Page - Milestone tracking and contributions
 */
const GoalsPage = () => {
  const { goals, selectedCurrency } = useFinanceData();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedGoalForContribute, setSelectedGoalForContribute] = useState(null);

  const totalTarget = goals.reduce((acc, g) => acc + (Number(g.targetAmount) || 0), 0);
  const totalSaved = goals.reduce((acc, g) => acc + (Number(g.currentAmount) || 0), 0);

  const handleOpenContribute = (goal) => {
    setSelectedGoalForContribute(goal);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Savings Milestones & Goals</h2>
          <p className="text-xs text-slate-500 mt-0.5">Visualize your progress towards vehicle purchases, trips, and long-term security pools</p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setAddModalOpen(true)}>
          Create Milestone
        </Button>
      </div>

      {/* Summary Banner */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Target className="w-7 h-7 text-emerald-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Aggregate Milestone Progress</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              You have accumulated <strong className="text-white">{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%</strong> of your entire milestone target pool.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-white/10">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Pool Collected</span>
            <span className="text-2xl font-black text-emerald-400">
              {formatCurrency(totalSaved, selectedCurrency)}
            </span>
          </div>

          <div className="h-10 w-px bg-white/20 hidden sm:block" />

          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Target Ceiling</span>
            <span className="text-2xl font-black text-white">
              {formatCurrency(totalTarget, selectedCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <GoalCards onContribute={handleOpenContribute} />

      {/* Modals */}
      <GoalFormModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <ContributeModal
        isOpen={Boolean(selectedGoalForContribute)}
        onClose={() => setSelectedGoalForContribute(null)}
        goal={selectedGoalForContribute}
      />
    </div>
  );
};

export default GoalsPage;
