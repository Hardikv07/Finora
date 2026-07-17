import React, { useState, useMemo } from 'react';
import { Plus, Filter, Download, FileUp } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useDebounce } from '../hooks/useDebounce';
import SearchBar from '../components/common/SearchBar';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionFormModal from '../components/transactions/TransactionFormModal';
import BillImportModal from '../components/transactions/BillImportModal';

/**
 * Transactions Page with search, filters, sorting, and export controls
 */
const TransactionsPage = () => {
  const { transactions, deleteTransaction } = useFinanceData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [billImportOpen, setBillImportOpen] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 250);

  // Extract all unique categories
  const allCategories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [transactions]);

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type matching
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // Category matching
      if (filterCategory !== 'all' && tx.category !== filterCategory) return false;

      // Search matching (merchant, category, notes, tags)
      if (debouncedQuery) {
        const query = debouncedQuery.toLowerCase();
        const matchMerchant = tx.merchant?.toLowerCase().includes(query);
        const matchCategory = tx.category?.toLowerCase().includes(query);
        const matchNotes = tx.notes?.toLowerCase().includes(query);
        const matchTags = Array.isArray(tx.tags)
          ? tx.tags.some((t) => t.toLowerCase().includes(query))
          : false;

        return matchMerchant || matchCategory || matchNotes || matchTags;
      }

      return true;
    });
  }, [transactions, filterType, filterCategory, debouncedQuery]);

  // Pagination slicing
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const handleOpenAdd = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['ID,Type,Date,Merchant,Category,Amount,PaymentMethod,Notes\n'];
    const rows = filteredTransactions.map((t) =>
      `"${t._id}","${t.type}","${t.date}","${t.merchant || ''}","${t.category || ''}",${t.amount},"${t.paymentMethod || ''}","${t.notes || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finora_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Financial Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage, filter, search, and export your transaction records</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" icon={FileUp} onClick={() => setBillImportOpen(true)}>
            Import Bill
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Search merchants, categories, or tags..."
          />
        </div>

        {/* Type & Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['all', 'income', 'expense'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setFilterType(t);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filterType === t ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
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
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer capitalize"
            >
              <option value="all">All Categories</option>
              {allCategories.filter((c) => c !== 'all').map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="space-y-0">
        <TransactionTable
          transactions={paginatedTransactions}
          onDelete={deleteTransaction}
          onEdit={handleOpenEdit}
        />
        <Pagination
          currentPage={currentPage}
          totalItems={filteredTransactions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal */}
      <TransactionFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTx(null);
        }}
        initialData={editingTx}
      />

      {/* Bill Import Modal */}
      <BillImportModal
        isOpen={billImportOpen}
        onClose={() => setBillImportOpen(false)}
      />
    </div>
  );
};

export default TransactionsPage;
