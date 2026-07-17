import React from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency } from '../../utils/formatters';
import { calculateCashFlow } from '../../utils/calculations';
import Tooltip from '../common/Tooltip';

/**
 * 4 Metric Stat Cards with percentage comparison pills
 */
const StatCards = () => {
  const { wallets, transactions, selectedCurrency } = useFinanceData();

  // Calculate Net Worth from wallets
  const totalBalance = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0);

  // Calculate cash flow from transactions
  const { totalIncome, totalExpense, netSavings, savingsRate } = calculateCashFlow(transactions);

  const stats = [
    {
      title: 'Total Balance (Net Worth)',
      amount: totalBalance,
      change: '+14.2%',
      isPositive: true,
      icon: Wallet,
      color: 'from-blue-600 to-indigo-600',
      tooltip: 'Combined liquid balance across all your bank accounts, credit cards, and wallets.'
    },
    {
      title: 'Monthly Total Income',
      amount: totalIncome,
      change: '+8.4%',
      isPositive: true,
      icon: TrendingUp,
      color: 'from-emerald-600 to-teal-600',
      tooltip: 'Aggregate earnings from salary, freelance projects, and dividends.'
    },
    {
      title: 'Monthly Total Expenses',
      amount: totalExpense,
      change: '-3.1%',
      isPositive: false,
      icon: TrendingDown,
      color: 'from-red-600 to-rose-600',
      tooltip: 'Sum of outgoing spendings including rent, subscriptions, dining, and bills.'
    },
    {
      title: 'Net Monthly Savings',
      amount: netSavings,
      change: `${savingsRate}% rate`,
      isPositive: netSavings >= 0,
      icon: PiggyBank,
      color: 'from-purple-600 to-violet-600',
      tooltip: 'Surplus cash remaining after all expenses (`Total Income - Total Expense`).'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
          >
            {/* Subtle background glow */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-tr ${stat.color} opacity-10 blur-xl group-hover:opacity-20 transition-opacity`} />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</span>
                <Tooltip content={stat.tooltip} />
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-white shadow-md shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {formatCurrency(stat.amount, selectedCurrency)}
              </h2>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                stat.isPositive
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {stat.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {stat.change}
              </span>
              <span className="text-slate-400">vs last period</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;
