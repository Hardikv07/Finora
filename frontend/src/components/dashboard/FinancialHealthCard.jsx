import React from 'react';
import { Award, ShieldCheck, TrendingUp, CheckCircle } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { calculateFinancialHealthScore, calculateCashFlow } from '../../utils/calculations';
import Tooltip from '../common/Tooltip';

/**
 * Financial Health Gauge Card styled exactly like the progress widget in the reference UI
 */
const FinancialHealthCard = () => {
  const { transactions, budgets, goals, wallets } = useFinanceData();

  const score = calculateFinancialHealthScore({ transactions, budgets, goals, wallets });
  const { savingsRate } = calculateCashFlow(transactions);

  const getStatus = (s) => {
    if (s >= 80) return { label: 'Excellent', color: 'text-[#86c8a7] bg-[#1d2622] border-[#293d33]', desc: 'Top-tier financial habits! High savings rate & budget control.' };
    if (s >= 65) return { label: 'Good Standing', color: 'text-[#93b4ed] bg-[#1e222a] border-[#2b3547]', desc: 'Solid momentum. Consider boosting emergency reserves.' };
    if (s >= 45) return { label: 'Needs Review', color: 'text-[#e58c44] bg-[#2b221a] border-[#422f21]', desc: 'Review high-spending categories to balance budget.' };
    return { label: 'Attention Needed', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', desc: 'Immediate action needed to curb burn rate.' };
  };

  const status = getStatus(score);

  return (
    <div className="glass-card h-full flex flex-col justify-between p-5">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#2e2e36]">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#ea9d85]" />
          <h3 className="font-bold text-white text-sm">Financial Health Score</h3>
          <Tooltip content="Calculated using multi-factor metrics: savings rate, budget adherence, emergency fund, and cash flow." />
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="py-5 flex flex-col sm:flex-row items-center gap-6">
        {/* Score Ring Gauge (styled like the DSA Progress circle in image) */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#2e2e36"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#d96b43"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={(2 * Math.PI * 40) * (1 - score / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-white leading-none">{score}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">out of 100</span>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="flex-1 space-y-3 w-full">
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {status.desc}
          </p>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#86c8a7]" />
                Savings Rate
              </span>
              <span className="font-bold text-[#86c8a7]">{savingsRate}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#93b4ed]" />
                Budget Safety
              </span>
              <span className="font-bold text-[#93b4ed]">
                {budgets.filter((b) => b.spent <= b.limit).length} / {budgets.length || 1} Safe
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#b09cec]" />
                Reserve Fund
              </span>
              <span className="font-bold text-[#b09cec]">76% Funded</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#2e2e36] flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1 text-[#ea9d85] font-medium">
          💡 Keep savings rate above 40% for optimal wealth score.
        </span>
      </div>
    </div>
  );
};

export default FinancialHealthCard;
