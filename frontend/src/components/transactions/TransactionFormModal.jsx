import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useFinanceData } from '../../hooks/useFinanceData';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../../constants/categories';
import { validateTransactionForm } from '../../utils/validators';

/**
 * Modal form for creating and editing Transactions
 */
const TransactionFormModal = ({ isOpen, onClose, initialData = null }) => {
  const { wallets, addTransaction } = useFinanceData();
  const [formData, setFormData] = useState({
    type: 'expense',
    merchant: '',
    amount: '',
    category: EXPENSE_CATEGORIES[0]?.name || 'Food & Dining',
    walletId: '',
    paymentMethod: PAYMENT_METHODS[0]?.name || 'UPI / PhonePe',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    tags: '',
    hasReceipt: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'expense',
        merchant: initialData.merchant || '',
        amount: initialData.amount || '',
        category: initialData.category || 'Food & Dining',
        walletId: initialData.walletId || wallets[0]?._id || '',
        paymentMethod: initialData.paymentMethod || PAYMENT_METHODS[0]?.name || 'UPI / PhonePe',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: initialData.notes || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags || '',
        hasReceipt: Boolean(initialData.hasReceipt)
      });
    } else {
      setFormData({
        type: 'expense',
        merchant: '',
        amount: '',
        category: EXPENSE_CATEGORIES[0]?.name || 'Food & Dining',
        walletId: wallets[0]?._id || '',
        paymentMethod: PAYMENT_METHODS[0]?.name || 'UPI / PhonePe',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        tags: '',
        hasReceipt: false
      });
    }
    setErrors({});
  }, [isOpen, initialData, wallets]);

  const handleTypeChange = (newType) => {
    const defaultCat = newType === 'income' ? INCOME_CATEGORIES[0]?.name : EXPENSE_CATEGORIES[0]?.name;
    setFormData((prev) => ({ ...prev, type: newType, category: defaultCat }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateTransactionForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        ...formData,
        amount: Number(formData.amount)
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Transaction' : 'Record New Transaction'}
      subtitle="Log income or expense entries into your financial ledger"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector (Income / Expense) */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 rounded-lg text-sm font-bold transition-all ${
              formData.type === 'expense'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expense (-)
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 rounded-lg text-sm font-bold transition-all ${
              formData.type === 'income'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Income (+)
          </button>
        </div>

        {/* Title / Merchant */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Title / Merchant Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="merchant"
            value={formData.merchant}
            onChange={handleChange}
            placeholder="e.g. Amazon, Starbucks, TechCorp Salary"
            className="input-field"
          />
          {errors.merchant && <p className="text-xs text-red-500 mt-1 font-medium">{errors.merchant}</p>}
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="input-field font-semibold text-lg"
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1 font-medium">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Transaction Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        {/* Category & Wallet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Linked Wallet / Account <span className="text-red-500">*</span>
            </label>
            <select
              name="walletId"
              value={formData.walletId}
              onChange={handleChange}
              className="input-field cursor-pointer"
            >
              {wallets.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} (₹{w.balance})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment Method & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="input-field cursor-pointer"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.id} value={pm.name}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. Groceries, Fixed Bill, Personal"
              className="input-field"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Optional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Add any extra details or memo for future reference..."
            className="input-field resize-none"
          />
        </div>

        {/* Receipt Attachment Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="hasReceipt"
            name="hasReceipt"
            checked={formData.hasReceipt}
            onChange={handleChange}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="hasReceipt" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Mark receipt invoice as uploaded / attached to this transaction
          </label>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {initialData ? 'Update Transaction' : 'Save Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionFormModal;
