import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Receipt } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';

/**
 * Recent Transactions summary table for Dashboard in High-Contrast Dark Theme
 */
const RecentTransactionsList = ({ onViewAll }) => {
  const { transactions, selectedCurrency } = useFinanceData();
  const recent = transactions.slice(0, 6);

  return (
    <div className="glass-card overflow-hidden p-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#2e2e36]">
        <div>
          <h3 className="font-bold text-white text-base">Recent Activity</h3>
          <p className="text-xs text-slate-400 font-medium">Latest incoming & outgoing financial entries</p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-[#ea9d85] hover:text-[#d96b43] flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          <p className="text-sm font-semibold text-white">No recent transactions found.</p>
          <p className="text-xs text-slate-400 mt-1">Use quick actions to record your first entry.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#26262e]">
          {recent.map((tx) => {
            const isIncome = tx.type?.toLowerCase() === 'income';
            return (
              <div
                key={tx._id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#202028] transition-colors rounded-xl px-2"
              >
                {/* Icon + Title + Category */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                      isIncome
                        ? 'bg-[#1d2622] text-[#86c8a7] border border-[#293d33]'
                        : 'bg-[#2b1c1d] text-[#f87171] border border-[#422325]'
                    }`}
                  >
                    {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{tx.merchant || 'Untitled Entry'}</h4>
                      {tx.hasReceipt && (
                        <Receipt className="w-3.5 h-3.5 text-[#ea9d85] shrink-0" title="Receipt Attached" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-medium">
                      <span className="font-bold px-2 py-0.5 rounded-md bg-[#24242c] text-white border border-[#383844]">
                        {tx.category || 'General'}
                      </span>
                      <span>•</span>
                      <span>{formatRelativeTime(tx.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Amount + Payment Method */}
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm sm:text-base font-black ${
                      isIncome ? 'text-[#86c8a7]' : 'text-[#f87171]'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount, selectedCurrency)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{tx.paymentMethod || 'Digital Wallet'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentTransactionsList;
