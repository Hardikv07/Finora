import React, { useState } from 'react';
import { BarChart2, TrendingUp, DollarSign } from 'lucide-react';
import { INITIAL_ANALYTICS } from '../../constants/dummyData';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency } from '../../utils/formatters';

/**
 * 6-Month Income vs Expense Bar/Area Comparison Chart in Dark Theme
 */
const MonthlyCashFlowChart = () => {
  const { selectedCurrency } = useFinanceData();
  const [activeTab, setActiveTab] = useState('comparison');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const data = INITIAL_ANALYTICS.monthlyComparison || [];

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income || 0, d.expense || 0, d.savings || 0)),
    100000
  );

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-[#2e2e36]">
        <div>
          <h3 className="font-bold text-white text-base">Monthly Cash Flow & Trends</h3>
          <p className="text-xs text-slate-400 font-medium">Historical 6-month comparison of your revenue and expenditure</p>
        </div>

        <div className="flex items-center bg-[#141416] p-1 rounded-xl text-xs font-semibold border border-[#2e2e36]">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'comparison' ? 'bg-[#d96b43] text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Income vs Expense
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'savings' ? 'bg-[#86c8a7] text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Net Savings
          </button>
        </div>
      </div>

      <div className="pt-4">
        {/* Legend */}
        <div className="flex items-center justify-end gap-5 text-xs font-semibold mb-6">
          {activeTab === 'comparison' ? (
            <>
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-3 h-3 rounded-md bg-[#86c8a7] shadow-sm"></span>
                Total Income
              </span>
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-3 h-3 rounded-md bg-[#f87171] shadow-sm"></span>
                Total Expense
              </span>
            </>
          ) : (
            <span className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-md bg-[#93b4ed] shadow-sm"></span>
              Surplus Savings
            </span>
          )}
        </div>

        {/* Bar Chart Container */}
        <div className="h-64 flex items-end justify-between gap-2 sm:gap-6 px-2 sm:px-6 relative border-b border-[#2e2e36] pb-2">
          {data.map((item, idx) => {
            const incPct = Math.round((item.income / maxVal) * 100);
            const expPct = Math.round((item.expense / maxVal) * 100);
            const savPct = Math.round((item.savings / maxVal) * 100);

            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-14 z-20 bg-[#22222a] border border-[#383844] text-white p-2.5 rounded-xl shadow-xl text-xs font-medium whitespace-nowrap animate-fade-in pointer-events-none">
                    <p className="font-bold text-[#ea9d85]">{item.month}</p>
                    {activeTab === 'comparison' ? (
                      <div className="space-y-0.5 mt-0.5">
                        <p className="text-[#86c8a7]">Income: {formatCurrency(item.income, selectedCurrency)}</p>
                        <p className="text-[#f87171]">Expense: {formatCurrency(item.expense, selectedCurrency)}</p>
                      </div>
                    ) : (
                      <p className="text-[#93b4ed] mt-0.5">Savings: {formatCurrency(item.savings, selectedCurrency)}</p>
                    )}
                  </div>
                )}

                {/* Bars */}
                <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2 h-full">
                  {activeTab === 'comparison' ? (
                    <>
                      {/* Income Bar */}
                      <div
                        className="w-1/2 max-w-[28px] bg-[#86c8a7] rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                        style={{ height: `${incPct}%` }}
                      />
                      {/* Expense Bar */}
                      <div
                        className="w-1/2 max-w-[28px] bg-[#f87171] rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                        style={{ height: `${expPct}%` }}
                      />
                    </>
                  ) : (
                    /* Savings Bar */
                    <div
                      className="w-full max-w-[40px] bg-[#93b4ed] rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                      style={{ height: `${savPct}%` }}
                    />
                  )}
                </div>

                {/* Month Label */}
                <span className="text-xs font-bold text-slate-400 mt-3 group-hover:text-white transition-colors">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthlyCashFlowChart;
