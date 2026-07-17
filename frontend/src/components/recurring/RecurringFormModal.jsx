import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useFinanceData } from '../../hooks/useFinanceData';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';

/**
 * Modal form for adding Recurring Subscriptions and Salaries
 */
const RecurringFormModal = ({ isOpen, onClose }) => {
  const { wallets, addRecurring } = useFinanceData();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    frequency: 'Monthly',
    nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: EXPENSE_CATEGORIES[0]?.name || 'Utilities & Bills',
    walletId: wallets[0]?._id || '',
    autoProcess: true
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeChange = (newType) => {
    const defaultCat = newType === 'income' ? INCOME_CATEGORIES[0]?.name : EXPENSE_CATEGORIES[0]?.name;
    setFormData((prev) => ({ ...prev, type: newType, category: defaultCat }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError('Please provide a valid title and positive amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addRecurring({
        ...formData,
        amount: Number(formData.amount)
      });
      onClose();
    } catch (err) {
      setError('Could not save recurring schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Recurring Schedule"
      subtitle="Automate fixed salary deposits, house rent, or monthly subscriptions"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Type Switcher */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 rounded-lg text-sm font-bold transition-all ${
              formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recurring Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 rounded-lg text-sm font-bold transition-all ${
              formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recurring Income
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Subscription / Salary Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Netflix Premium, TechCorp Salary"
            className="input-field"
          />
        </div>

        {/* Amount & Frequency */}
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
              className="input-field font-bold text-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Billing Frequency
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="input-field cursor-pointer"
            >
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Category & Wallet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Category
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
              Linked Account
            </label>
            <select
              name="walletId"
              value={formData.walletId}
              onChange={handleChange}
              className="input-field cursor-pointer font-medium"
            >
              {wallets.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Next Due Date */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Next Due / Billing Date
          </label>
          <input
            type="date"
            name="nextDueDate"
            value={formData.nextDueDate}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* Auto Process Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="autoProcess"
            name="autoProcess"
            checked={formData.autoProcess}
            onChange={handleChange}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="autoProcess" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Automatically log this entry on its due date without manual confirmation
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Save Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecurringFormModal;
