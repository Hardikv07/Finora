import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Trash2, Edit3, Receipt, ArrowUpDown, Tag } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card from '../common/Card';

/**
 * Highlights occurrences of `query` inside `text` with a yellow <mark>
 */
const Highlight = ({ text, query }) => {
  if (!query || !text) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

/**
 * Full-featured Transaction Table with sorting and actions
 */
const TransactionTable = ({ transactions = [], onDelete, onEdit, searchQuery = '' }) => {
  const { selectedCurrency } = useFinanceData();
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'date') {
      aValue = new Date(a.date).getTime();
      bValue = new Date(b.date).getTime();
    } else if (sortField === 'amount') {
      aValue = Number(a.amount) || 0;
      bValue = Number(b.amount) || 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Card bodyClassName="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="py-4 px-6 min-w-[220px]">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-1.5 hover:text-slate-800 transition-colors"
                >
                  <span>Title & Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-4 px-4 min-w-[140px]">Category</th>
              <th className="py-4 px-4 min-w-[150px]">Payment / Wallet</th>
              <th className="py-4 px-4 min-w-[160px]">Tags</th>
              <th className="py-4 px-6 text-right min-w-[140px]">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center justify-end gap-1.5 hover:text-slate-800 transition-colors ml-auto"
                >
                  <span>Amount</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-4 px-6 text-right min-w-[100px]">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100/80 text-sm">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <p className="font-semibold text-base">No transactions match your search filter.</p>
                  <p className="text-xs text-slate-400 mt-1">Try clearing your search terms or filters.</p>
                </td>
              </tr>
            ) : (
              sortedTransactions.map((tx) => {
                // Normalize type comparison — backend sends 'INCOME'/'EXPENSE', dummy data uses lowercase
                const isIncome = tx.type?.toLowerCase() === 'income';
                const tags = Array.isArray(tx.tags) ? tx.tags : [];

                return (
                  <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Title & Date */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isIncome
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                            }`}
                        >
                          {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate block max-w-[180px]">
                              <Highlight text={tx.merchant || 'General Entry'} query={searchQuery} />
                            </span>
                            {tx.hasReceipt && (
                              tx.receiptUrl ? (
                                <a href={tx.receiptUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 group-hover:scale-110 transition-transform" title="View Uploaded Receipt">
                                  <Receipt className="w-3.5 h-3.5 text-indigo-500 hover:text-indigo-600 transition-colors" />
                                </a>
                              ) : (
                                <Receipt className="w-3.5 h-3.5 text-indigo-500 shrink-0" title="Receipt Attached (Offline)" />
                              )
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-medium">{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                        <Highlight text={tx.category || 'Other'} query={searchQuery} />
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-4 px-4 text-xs font-medium text-slate-600">
                      <div>{tx.paymentMethod || 'Digital Wallet'}</div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          <Highlight text={tx.notes} query={searchQuery} />
                        </div>
                      )}
                    </td>

                    {/* Tags */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {tags.length > 0 ? (
                          tags.map((t, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100"
                            >
                              <Tag className="w-2.5 h-2.5 shrink-0" />
                              <Highlight text={t} query={searchQuery} />
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-300 italic">No tags</span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`font-black text-base ${isIncome ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, selectedCurrency)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(tx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit transaction"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete && onDelete(tx._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default TransactionTable;
