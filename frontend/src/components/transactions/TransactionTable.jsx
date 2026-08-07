import React, { useState } from 'react';
import { ArrowUpDown, ArrowUpRight, ArrowDownRight, Edit3, Trash2, Tag, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useFinanceData } from '../../hooks/useFinanceData';
import Card from '../common/Card';

/**
 * Text Highlight helper to wrap matching search query in bright yellow/amber badge
 */
const Highlight = ({ text, query }) => {
  if (!query || !text) return <>{text}</>;

  const str = String(text);
  const parts = str.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <>
      {parts.map((part, idx) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={idx} className="bg-amber-400 text-slate-950 rounded px-0.5 font-bold">
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
 * High-Contrast Dark Transaction Table Component
 */
const TransactionTable = ({ transactions, onEdit, onDelete, searchQuery }) => {
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
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#22222a] border-b border-[#2e2e36] text-slate-300 text-xs font-bold uppercase tracking-wider">
              <th className="py-4 px-6 min-w-[220px]">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
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
                  className="flex items-center justify-end gap-1.5 hover:text-white transition-colors ml-auto"
                >
                  <span>Amount</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-4 px-6 text-right min-w-[100px]">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#26262e] text-sm">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <p className="font-bold text-base text-white">No transactions match your search filter.</p>
                  <p className="text-xs text-slate-400 mt-1">Try clearing your search terms or filters.</p>
                </td>
              </tr>
            ) : (
              sortedTransactions.map((tx) => {
                const isIncome = tx.type?.toLowerCase() === 'income';
                const tags = Array.isArray(tx.tags) ? tx.tags : [];

                return (
                  <tr key={tx._id} className="hover:bg-[#202028] transition-colors group">
                    {/* Title & Date */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${isIncome
                              ? 'bg-[#1d2622] text-[#86c8a7] border border-[#293d33]'
                              : 'bg-[#2b1c1d] text-[#f87171] border border-[#422325]'
                            }`}
                        >
                          {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate block max-w-[180px]">
                              <Highlight text={tx.merchant || 'General Entry'} query={searchQuery} />
                            </span>
                            {tx.hasReceipt && (
                              tx.receiptUrl ? (
                                <a href={tx.receiptUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 group-hover:scale-110 transition-transform" title="View Uploaded Receipt">
                                  <Receipt className="w-3.5 h-3.5 text-[#ea9d85] hover:text-[#d96b43] transition-colors" />
                                </a>
                              ) : (
                                <Receipt className="w-3.5 h-3.5 text-[#ea9d85] shrink-0" title="Receipt Attached (Offline)" />
                              )
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-medium">{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#24242c] text-white border border-[#383844]">
                        <Highlight text={tx.category || 'Other'} query={searchQuery} />
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-4 px-4 text-xs font-medium text-slate-300">
                      <div className="font-semibold text-slate-200">{tx.paymentMethod || 'Digital Wallet'}</div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px] mt-0.5">
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
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#3b231c] text-[#ea9d85] border border-[#543025]"
                            >
                              <Tag className="w-2.5 h-2.5 shrink-0" />
                              <Highlight text={t} query={searchQuery} />
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic font-medium">No tags</span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`font-black text-base ${isIncome ? 'text-[#86c8a7]' : 'text-[#f87171]'
                          }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, selectedCurrency)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2e2320] transition-colors"
                            title="Edit transaction"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(tx._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
    </div>
  );
};

export default TransactionTable;
