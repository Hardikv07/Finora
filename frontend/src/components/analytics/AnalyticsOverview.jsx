import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, PieChart as PieIcon, BarChart3, TrendingDown, ArrowUpRight } from 'lucide-react';
import { INITIAL_ANALYTICS } from '../../constants/dummyData';
import { useFinanceData } from '../../hooks/useFinanceData';
import { getCategoryExpenses } from '../../utils/calculations';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card from '../common/Card';

/**
 * Analytics Overview with AI Anomaly Detection callouts, spending insights, and category breakdown
 */
const AnalyticsOverview = () => {
  const { transactions, selectedCurrency } = useFinanceData();

  const anomalies = INITIAL_ANALYTICS.anomalies || [];
  const insights = INITIAL_ANALYTICS.insights || [];
  const categoryBreakdown = getCategoryExpenses(transactions);

  const totalExpense = categoryBreakdown.reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner: AI Anomaly Detection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {anomalies.map((anom) => {
          const isWarn = anom.severity === 'warning';
          return (
            <div
              key={anom.id}
              className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${
                isWarn
                  ? 'bg-amber-50/90 border-amber-200/80 text-amber-950'
                  : 'bg-emerald-50/90 border-emerald-200/80 text-emerald-950'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isWarn ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {isWarn ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm truncate">{anom.title}</h4>
                  <span className="text-[10px] font-semibold opacity-70 shrink-0">{formatDate(anom.date)}</span>
                </div>
                <p className="text-xs mt-1 leading-relaxed opacity-90">{anom.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Expense Breakdown */}
        <Card
          title="Expense by Category"
          subtitle="Where your outgoing funds are allocated"
          className="lg:col-span-2"
        >
          {categoryBreakdown.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No expense records found to generate category report.</p>
          ) : (
            <div className="space-y-4 pt-2">
              {categoryBreakdown.map((item, idx) => {
                const perc = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{item.name}</span>
                      <span className="text-slate-600">
                        {formatCurrency(item.amount, selectedCurrency)}{' '}
                        <span className="text-slate-400 font-normal">({perc}%)</span>
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div
                        style={{ width: `${perc}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-primary-600 transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Smart Insights & Recommendations */}
        <Card
          title="FinPulse AI Insights"
          subtitle="Automated recommendations based on pattern analysis"
        >
          <div className="space-y-4 pt-1">
            {insights.map((ins, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950 font-medium leading-relaxed"
              >
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>{ins}</span>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-100 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Updated in real-time by Rule Engine
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsOverview;
