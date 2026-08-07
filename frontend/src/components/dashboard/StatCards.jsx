import React from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency } from '../../utils/formatters';
import { calculateCashFlow } from '../../utils/calculations';
import Tooltip from '../common/Tooltip';

/**
 * Category Stat Cards styled exactly like the reference UI's capsule cards (Peach, Mint, Lavender, Pastel Blue)
 */
const StatCards = () => {
  const { wallets, transactions, selectedCurrency } = useFinanceData();

  const totalBalance = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
  const { totalIncome, totalExpense, netSavings, savingsRate } = calculateCashFlow(transactions);

  const stats = [
    {
      title: 'Total Net Worth',
      amount: totalBalance,
      change: '+14.2%',
      isPositive: true,
      icon: Wallet,
      pillBg: 'bg-[#ea9d85] text-slate-950',
      glow: 'shadow-[#ea9d85]/20',
      tooltip: 'Combined liquid balance across all your bank accounts, credit cards, and wallets.'
    },
    {
      title: 'Monthly Income',
      amount: totalIncome,
      change: '+8.4%',
      isPositive: true,
      icon: TrendingUp,
      pillBg: 'bg-[#86c8a7] text-slate-950',
      glow: 'shadow-[#86c8a7]/20',
      tooltip: 'Aggregate earnings from salary, freelance projects, and dividends.'
    },
    {
      title: 'Monthly Expenses',
      amount: totalExpense,
      change: '-3.1%',
      isPositive: false,
      icon: TrendingDown,
      pillBg: 'bg-[#b09cec] text-slate-950',
      glow: 'shadow-[#b09cec]/20',
      tooltip: 'Sum of outgoing spendings including rent, subscriptions, dining, and bills.'
    },
    {
      title: 'Net Savings',
      amount: netSavings,
      change: `${savingsRate}% rate`,
      isPositive: netSavings >= 0,
      icon: PiggyBank,
      pillBg: 'bg-[#93b4ed] text-slate-950',
      glow: 'shadow-[#93b4ed]/20',
      tooltip: 'Surplus cash remaining after all expenses (Income - Expenses).'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="category-capsule-card group hover:-translate-y-1 transition-all duration-300"
          >
            {/* Top Pastel Capsule Header (Matching image category cards) */}
            <div className={`w-full py-6 rounded-2xl ${stat.pillBg} flex items-center justify-center shadow-md ${stat.glow} transition-transform group-hover:scale-[1.02]`}>
              <Icon className="w-8 h-8" />
            </div>

            {/* Title & Amount Container */}
            <div className="w-full mt-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.title}</span>
                <Tooltip content={stat.tooltip} />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatCurrency(stat.amount, selectedCurrency)}
              </h2>
            </div>

            {/* Bottom Change Indicator */}
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border ${
                stat.isPositive
                  ? 'bg-[#1d2622] text-[#86c8a7] border-[#293d33]'
                  : 'bg-[#2b1c1d] text-[#f87171] border-[#422325]'
              }`}>
                {stat.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {stat.change}
              </span>
              <span className="text-slate-500">vs last month</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;
