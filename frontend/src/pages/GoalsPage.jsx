import React, { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { formatCurrency } from '../utils/formatters';
import GoalCards from '../components/goals/GoalCards';
import GoalFormModal from '../components/goals/GoalFormModal';
import ContributeModal from '../components/goals/ContributeModal';
import Button from '../components/common/Button';

/**
 * Savings Goals Page in crisp Dark Palette
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
          <h2 className="text-2xl font-black text-white tracking-tight">Savings Milestones & Goals</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Visualize your progress towards vehicle purchases, trips, and long-term security pools</p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setAddModalOpen(true)}>
          Create Milestone
        </Button>
      </div>

      {/* Summary Banner */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-[#1c1c22] via-[#1d2622] to-[#1c1c22] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border-[#2e2e36]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1d2622] border border-[#293d33] flex items-center justify-center shrink-0">
            <Target className="w-7 h-7 text-[#86c8a7]" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Aggregate Milestone Progress</h3>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              You have accumulated <strong className="text-[#86c8a7]">{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%</strong> of your entire milestone target pool.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-[#2e2e36]">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Pool Collected</span>
            <span className="text-2xl font-black text-[#86c8a7]">
              {formatCurrency(totalSaved, selectedCurrency)}
            </span>
          </div>

          <div className="h-10 w-px bg-[#2e2e36] hidden sm:block" />

          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Target Ceiling</span>
            <span className="text-2xl font-black text-white">
              {formatCurrency(totalTarget, selectedCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Goals Cards Grid */}
      <GoalCards onContribute={handleOpenContribute} />

      {/* Goal Add Modal */}
      <GoalFormModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />

      {/* Contribute Modal */}
      <ContributeModal
        isOpen={!!selectedGoalForContribute}
        onClose={() => setSelectedGoalForContribute(null)}
        goal={selectedGoalForContribute}
      />
    </div>
  );
};

export default GoalsPage;
