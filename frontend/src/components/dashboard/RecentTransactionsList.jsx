import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Receipt } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import Card from '../common/Card';

/**
 * Recent Transactions summary table/list for Dashboard
 */
const RecentTransactionsList = ({ onViewAll }) => {
  const { transactions, selectedCurrency } = useFinanceData();

  const recent = transactions.slice(0, 6);

  return (
    <Card
      title="Recent Activity"
      subtitle="Latest incoming & outgoing financial entries"
      actions={
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      }
      bodyClassName="p-0"
    >
      {recent.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          <p className="text-sm font-medium">No recent transactions found.</p>
          <p className="text-xs text-slate-400 mt-1">Use quick actions to record your first entry.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100/80">
          {recent.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <div
                key={tx._id}
                className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                {/* Icon + Title + Category */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{tx.merchant || 'Untitled Entry'}</h4>
                      {tx.hasReceipt && (
                        <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Receipt Attached" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
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
                      isIncome ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount, selectedCurrency)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{tx.paymentMethod || 'Wallet'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default RecentTransactionsList;
