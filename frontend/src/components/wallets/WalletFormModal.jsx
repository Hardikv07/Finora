import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useFinanceData } from '../../hooks/useFinanceData';
import { WALLET_TYPES } from '../../constants/categories';
import { validateWalletForm } from '../../utils/validators';

/**
 * Modal form for creating a new Wallet or Bank Account
 */
const WalletFormModal = ({ isOpen, onClose }) => {
  const { addWallet } = useFinanceData();
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    balance: '',
    accountNumber: '',
    color: 'from-blue-600 to-indigo-700',
    isPrimary: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = [
    { label: 'Royal Blue', value: 'from-blue-600 to-indigo-700' },
    { label: 'Emerald Green', value: 'from-emerald-600 to-teal-700' },
    { label: 'Purple Pink', value: 'from-purple-600 to-pink-600' },
    { label: 'Slate Dark', value: 'from-slate-800 to-slate-900' },
    { label: 'Amber Gold', value: 'from-amber-500 to-orange-600' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateWalletForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await addWallet({
        ...formData,
        balance: Number(formData.balance)
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Wallet / Account"
      subtitle="Link a new bank account, credit card, or digital pocket to Finora"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Wallet Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Wallet / Account Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. ICICI Salary Account, SBI Credit Card"
            className="input-field"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
        </div>

        {/* Type & Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input-field cursor-pointer capitalize"
            >
              {WALLET_TYPES.map((wt) => (
                <option key={wt.id} value={wt.id}>
                  {wt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Initial Balance (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              name="balance"
              value={formData.balance}
              onChange={handleChange}
              placeholder="0.00"
              className="input-field font-semibold"
            />
            {errors.balance && <p className="text-xs text-red-500 mt-1 font-medium">{errors.balance}</p>}
          </div>
        </div>

        {/* Account Number & Card Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Account/Card Mask (Optional)
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="e.g. **** 3912 or UPI ID"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Card Color Theme
            </label>
            <select
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="input-field cursor-pointer"
            >
              {colors.map((col, idx) => (
                <option key={idx} value={col.value}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isPrimary"
            name="isPrimary"
            checked={formData.isPrimary}
            onChange={handleChange}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="isPrimary" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Set as Primary default wallet for new transactions
          </label>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Save Wallet
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WalletFormModal;
