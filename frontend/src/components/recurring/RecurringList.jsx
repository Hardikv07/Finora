import React from 'react';
import { Repeat, ArrowUpRight, ArrowDownRight, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card from '../common/Card';

/**
 * Recurring Subscriptions & Automatic Salaries List
 */
const RecurringList = ({ onDelete }) => {
  const { recurring, wallets, selectedCurrency } = useFinanceData();

  if (recurring.length === 0) {
    return (
      <Card bodyClassName="p-12 text-center text-slate-500">
        <Repeat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">No Recurring Entries</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Automate fixed monthly expenses (rent, subscriptions, internet) or monthly salary deposits.
        </p>
      </Card>
    );
  }

  const totalRecurringExpense = recurring
    .filter((r) => r.type === 'expense')
    .reduce((acc, r) => acc + Number(r.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="glass-card rounded-2xl p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Repeat className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-base">Automated Ledger Engine Active</h3>
            <p className="text-xs text-slate-300">
              {recurring.length} automated rules scheduled to log exactly on their due dates.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider block">
            Total Monthly Fixed Outflow
          </span>
          <span className="text-2xl font-black text-rose-400">
            -{formatCurrency(totalRecurringExpense, selectedCurrency)}
          </span>
        </div>
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recurring.map((item) => {
          const isIncome = item.type === 'income';
          const wallet = wallets.find((w) => w._id === item.walletId);

          return (
            <div
              key={item._id}
              className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4 group transition-all hover:border-indigo-200"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base truncate">{item.title}</h4>
                    {item.autoProcess && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Auto-Pay
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{item.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Due: {formatDate(item.nextDueDate)}
                    </span>
                  </div>
                  {wallet && (
                    <p className="text-[11px] text-slate-400 mt-1 truncate">Linked to: {wallet.name}</p>
                  )}
                </div>
              </div>

              {/* Amount & Delete */}
              <div className="text-right shrink-0 flex flex-col items-end justify-between h-full">
                <span
                  className={`font-black text-lg ${
                    isIncome ? 'text-emerald-600' : 'text-slate-900'
                  }`}
                >
                  {isIncome ? '+' : '-'}
                  {formatCurrency(item.amount, selectedCurrency)}
                </span>
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  {item.frequency || 'Monthly'}
                </span>

                <button
                  onClick={() => onDelete(item._id)}
                  className="mt-2 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-80 group-hover:opacity-100"
                  title="Cancel recurring entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecurringList;
