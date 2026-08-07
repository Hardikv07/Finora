import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, FileUp, X } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionFormModal from '../components/transactions/TransactionFormModal';
import Pagination from '../components/common/Pagination';
import Button from '../components/common/Button';
import BillImportModal from '../components/transactions/BillImportModal';

/**
 * Financial Ledger & Transactions Page in crisp High-Contrast Dark Palette
 */
const TransactionsPage = ({ defaultSearchQuery, onClearSearch }) => {
  const { transactions, deleteTransaction } = useFinanceData();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(defaultSearchQuery || '');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [filterCategory, setFilterCategory] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [billImportOpen, setBillImportOpen] = useState(false);

  // Synchronize when top navbar search selects a term
  React.useEffect(() => {
    if (defaultSearchQuery !== undefined && defaultSearchQuery !== searchQuery) {
      setSearchQuery(defaultSearchQuery);
      setCurrentPage(1);
    }
  }, [defaultSearchQuery]);

  const debouncedQuery = searchQuery.trim().toLowerCase();

  // Combined categories list for filter dropdown
  const allCategories = useMemo(() => {
    return [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type Filter
      if (filterType !== 'all') {
        const txType = tx.type?.toLowerCase();
        if (txType !== filterType) return false;
      }

      // Category Filter
      if (filterCategory !== 'all' && tx.category !== filterCategory) {
        return false;
      }

      // Search Query Filter across multiple fields
      if (debouncedQuery) {
        const merchantMatch = (tx.merchant || '').toLowerCase().includes(debouncedQuery);
        const categoryMatch = (tx.category || '').toLowerCase().includes(debouncedQuery);
        const notesMatch = (tx.notes || '').toLowerCase().includes(debouncedQuery);
        const amountMatch = (tx.amount || '').toString().includes(debouncedQuery);

        const tags = Array.isArray(tx.tags) ? tx.tags : [];
        const tagsMatch = tags.some((t) => (t || '').toLowerCase().includes(debouncedQuery));

        if (!merchantMatch && !categoryMatch && !notesMatch && !amountMatch && !tagsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filterType, filterCategory, debouncedQuery]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const handleOpenAdd = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Financial Ledger</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage, filter, and search your transaction records</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" icon={FileUp} onClick={() => setBillImportOpen(true)}>
            Import Bill
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter Toolbar in High-Contrast Dark Surface */}
      <div className="relative z-10 bg-[#19191d] border border-[#2e2e36] shadow-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                if (onClearSearch && !e.target.value) onClearSearch();
              }}
              placeholder="Search merchants, categories, tags, amounts..."
              autoComplete="off"
              className="w-full pl-10 pr-9 py-2.5 bg-[#141416] border border-[#2e2e36] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#d96b43]/30 focus:border-[#d96b43] transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setCurrentPage(1); if (onClearSearch) onClearSearch(); }}
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#282830] transition-colors z-10"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Type & Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {(debouncedQuery || filterType !== 'all' || filterCategory !== 'all') && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#3b231c] text-[#ea9d85] border border-[#543025]">
              {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
            </span>
          )}

          <div className="flex items-center bg-[#141416] p-1 rounded-xl text-xs font-semibold border border-[#2e2e36]">
            {['all', 'income', 'expense'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setFilterType(t);
                  setFilterCategory('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filterType === t ? 'bg-[#d96b43] text-white shadow-sm font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#141416] border border-[#2e2e36] text-xs font-semibold text-white py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d96b43]/30 cursor-pointer"
            >
              <option value="all" className="bg-[#141416] text-white">All Categories</option>
              {allCategories.map((c) => (
                <option key={c.id || c.name} value={c.name} className="bg-[#141416] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Transactions Data Table */}
      <TransactionTable
        transactions={paginatedTransactions}
        onEdit={handleOpenEdit}
        onDelete={deleteTransaction}
        searchQuery={debouncedQuery}
      />

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add / Edit Transaction Modal */}
      <TransactionFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingTx}
      />

      {/* Bill OCR Import Modal */}
      <BillImportModal
        isOpen={billImportOpen}
        onClose={() => setBillImportOpen(false)}
      />
    </div>
  );
};

export default TransactionsPage;
