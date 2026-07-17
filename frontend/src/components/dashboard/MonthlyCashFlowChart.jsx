import React, { useState } from 'react';
import { BarChart2, TrendingUp, DollarSign } from 'lucide-react';
import { INITIAL_ANALYTICS } from '../../constants/dummyData';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency } from '../../utils/formatters';
import Card from '../common/Card';

/**
 * 6-Month Income vs Expense Bar/Area Comparison Chart
 */
const MonthlyCashFlowChart = () => {
  const { selectedCurrency } = useFinanceData();
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'savings'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const data = INITIAL_ANALYTICS.monthlyComparison || [];

  // Find max for scale
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income || 0, d.expense || 0, d.savings || 0)),
    100000
  );

  return (
    <Card
      title="Monthly Cash Flow & Trends"
      subtitle="Historical 6-month comparison of your revenue and expenditure"
      actions={
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'comparison' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Income vs Expense
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'savings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Net Savings
          </button>
        </div>
      }
    >
      <div className="pt-2">
        {/* Legend */}
        <div className="flex items-center justify-end gap-5 text-xs font-semibold mb-6">
          {activeTab === 'comparison' ? (
            <>
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm"></span>
                Total Income
              </span>
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-3 h-3 rounded-md bg-rose-500 shadow-sm"></span>
                Total Expense
              </span>
            </>
          ) : (
            <span className="flex items-center gap-2 text-slate-700">
              <span className="w-3 h-3 rounded-md bg-indigo-600 shadow-sm"></span>
              Monthly Surplus / Net Savings
            </span>
          )}
        </div>

        {/* Bar Chart Grid Area */}
        <div className="relative h-64 flex items-end justify-between gap-2 sm:gap-6 pt-8 pb-6 border-b border-slate-200">
          {/* Horizontal Grid lines */}
          <div className="absolute inset-x-0 top-0 border-t border-slate-100 border-dashed pointer-events-none" />
          <div className="absolute inset-x-0 top-1/2 border-t border-slate-100 border-dashed pointer-events-none" />

          {data.map((item, idx) => {
            const incomeHeight = Math.max(((item.income || 0) / maxVal) * 100, 4);
            const expenseHeight = Math.max(((item.expense || 0) / maxVal) * 100, 4);
            const savingsHeight = Math.max(((item.savings || 0) / maxVal) * 100, 4);

            return (
              <div
                key={item.month}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
              >
                {/* Tooltip on hover */}
                {hoveredIndex === idx && (
                  <div className="absolute -top-14 z-20 bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs font-medium whitespace-nowrap animate-fade-in pointer-events-none">
                    <p className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-200">{item.month} 2026 Summary</p>
                    {activeTab === 'comparison' ? (
                      <>
                        <p className="text-emerald-400">Income: {formatCurrency(item.income, selectedCurrency)}</p>
                        <p className="text-rose-400">Expense: {formatCurrency(item.expense, selectedCurrency)}</p>
                      </>
                    ) : (
                      <p className="text-indigo-300">Net Savings: {formatCurrency(item.savings, selectedCurrency)}</p>
                    )}
                  </div>
                )}

                {/* Bars */}
                <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full max-w-[60px]">
                  {activeTab === 'comparison' ? (
                    <>
                      {/* Income Bar */}
                      <div
                        style={{ height: `${incomeHeight}%` }}
                        className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${expenseHeight}%` }}
                        className="w-1/2 bg-gradient-to-t from-rose-600 to-rose-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                      />
                    </>
                  ) : (
                    /* Savings Bar */
                    <div
                      style={{ height: `${savingsHeight}%` }}
                      className="w-4/5 bg-gradient-to-t from-indigo-700 via-indigo-600 to-purple-600 rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-md"
                    />
                  )}
                </div>

                {/* X-axis label */}
                <span className="text-xs font-bold text-slate-600 mt-3">{item.month}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Insight Footnote */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Your income grew by <strong className="text-slate-800">32.2%</strong> from Feb to July.
          </span>
          <span className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-md text-slate-600">
            Avg: {formatCurrency(175000, selectedCurrency)}/mo
          </span>
        </div>
      </div>
    </Card>
  );
};

export default MonthlyCashFlowChart;
