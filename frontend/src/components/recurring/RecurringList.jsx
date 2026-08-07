import React from 'react';
import { ArrowUpRight, ArrowDownRight, Calendar, CheckCircle2, Trash2 } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Recurring Transactions List in High-Contrast Dark Theme
 */
const RecurringList = ({ onDelete }) => {
  const { recurring, wallets, selectedCurrency } = useFinanceData();

  if (recurring.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-slate-400">
        <p className="font-bold text-lg text-white">No recurring schedules active.</p>
        <p className="text-xs text-slate-400 mt-1">Automate your monthly subscriptions, salary, and utility bill debits.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden p-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#2e2e36]">
        <div>
          <h3 className="font-bold text-white text-base">Active Recurring Schedules</h3>
          <p className="text-xs text-slate-400 font-medium">Automated debits & predictable monthly cash flow entries</p>
        </div>
        <span className="text-xs font-bold text-[#ea9d85] px-2.5 py-1 rounded-full bg-[#3b231c] border border-[#543025]">
          {recurring.length} Active
        </span>
      </div>

      <div className="divide-y divide-[#26262e]">
        {recurring.map((item) => {
          const isIncome = item.type?.toLowerCase() === 'income';
          const wallet = wallets.find((w) => w._id === item.wallet);

          return (
            <div
              key={item._id}
              className="py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 hover:bg-[#202028] transition-colors rounded-xl px-2"
            >
              {/* Icon & Title Info */}
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
                    <h4 className="font-bold text-white text-base truncate">{item.title}</h4>
                    {item.autoProcess && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#3b231c] text-[#ea9d85] border border-[#543025]">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Auto-Pay
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
                    <span className="font-bold text-slate-200">{item.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Due: {formatDate(item.nextDueDate)}
                    </span>
                  </div>
                  {wallet && (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate font-medium">Linked to: {wallet.name}</p>
                  )}
                </div>
              </div>

              {/* Amount & Delete */}
              <div className="text-right shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                <span
                  className={`font-black text-lg ${
                    isIncome ? 'text-[#86c8a7]' : 'text-[#f87171]'
                  }`}
                >
                  {isIncome ? '+' : '-'}
                  {formatCurrency(item.amount, selectedCurrency)}
                </span>
                
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-[#24242c] px-2 py-0.5 rounded border border-[#383844]">
                    {item.frequency || 'Monthly'}
                  </span>
                  
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item._id)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Cancel schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecurringList;
