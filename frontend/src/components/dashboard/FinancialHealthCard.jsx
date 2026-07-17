import React from 'react';
import { ShieldCheck, Award, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { calculateFinancialHealthScore, calculateCashFlow } from '../../utils/calculations';
import Card from '../common/Card';
import Tooltip from '../common/Tooltip';

/**
 * Financial Health Score Gauge & Insights Card
 */
const FinancialHealthCard = () => {
  const { transactions, budgets, goals, wallets } = useFinanceData();

  const score = calculateFinancialHealthScore({ transactions, budgets, goals, wallets });
  const { savingsRate } = calculateCashFlow(transactions);

  const getStatus = (s) => {
    if (s >= 80) return { label: 'Excellent Status', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', desc: 'Your financial habits are top-tier! High savings & adherence.' };
    if (s >= 65) return { label: 'Good Standing', color: 'text-blue-600 bg-blue-50 border-blue-200', desc: 'Solid momentum. Consider boosting emergency reserves.' };
    if (s >= 45) return { label: 'Needs Optimization', color: 'text-amber-600 bg-amber-50 border-amber-200', desc: 'Review high-spending categories to balance budget.' };
    return { label: 'Attention Required', color: 'text-red-600 bg-red-50 border-red-200', desc: 'Immediate action needed to curb burn rate.' };
  };

  const status = getStatus(score);

  return (
    <Card className="h-full flex flex-col justify-between border-indigo-100/60 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-base">AI Financial Health Score</h3>
          <Tooltip content="Calculated using a multi-factor formula: savings rate (40%), budget adherence (30%), emergency fund coverage (20%), and debt-to-income balance (10%)." />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="py-6 flex flex-col sm:flex-row items-center gap-6">
        {/* Score Ring Gauge */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-100"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={(2 * Math.PI * 40) * (1 - score / 100)}
              strokeLinecap="round"
              className="text-indigo-600 transition-all duration-1000 ease-out"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-slate-900 leading-none">{score}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">out of 100</span>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="flex-1 space-y-3 w-full">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {status.desc}
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Net Savings Rate
              </span>
              <span className="font-bold text-slate-800">{savingsRate}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                Budget Adherence
              </span>
              <span className="font-bold text-slate-800">
                {budgets.filter((b) => b.spent <= b.limit).length} / {budgets.length || 1} Safe
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                Emergency Reserve
              </span>
              <span className="font-bold text-slate-800">76% Covered</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1 text-indigo-600 font-semibold">
          AI Suggestion: Keep savings rate above 40% for optimal score growth.
        </span>
      </div>
    </Card>
  );
};

export default FinancialHealthCard;
