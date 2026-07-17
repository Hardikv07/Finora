import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useFinanceData } from '../../hooks/useFinanceData';
import { ArrowRightLeft } from 'lucide-react';

/**
 * Modal form for transferring funds between two wallets
 */
const TransferModal = ({ isOpen, onClose, initialFromWalletId = null }) => {
  const { wallets, transferFunds } = useFinanceData();
  const [formData, setFormData] = useState({
    fromWalletId: '',
    toWalletId: '',
    amount: ''
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (wallets.length > 1) {
      const fromId = initialFromWalletId || wallets[0]?._id || '';
      const toId = wallets.find((w) => w._id !== fromId)?._id || wallets[1]?._id || '';
      setFormData({
        fromWalletId: fromId,
        toWalletId: toId,
        amount: ''
      });
    }
    setError(null);
  }, [isOpen, initialFromWalletId, wallets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError('Please enter a valid positive transfer amount.');
      return;
    }
    if (formData.fromWalletId === formData.toWalletId) {
      setError('Source and destination wallets must be different.');
      return;
    }

    setIsSubmitting(true);
    try {
      await transferFunds({
        fromWalletId: formData.fromWalletId,
        toWalletId: formData.toWalletId,
        amount: Number(formData.amount)
      });
      onClose();
    } catch (err) {
      setError('Transfer failed. Please verify balances.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Funds Across Wallets"
      subtitle="Instant real-time ledger transfer with zero transaction fees"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* From Wallet */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Source Wallet (From)
          </label>
          <select
            value={formData.fromWalletId}
            onChange={(e) => setFormData((prev) => ({ ...prev, fromWalletId: e.target.value }))}
            className="input-field cursor-pointer font-medium"
          >
            {wallets.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} (Available: ₹{w.balance})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
        </div>

        {/* To Wallet */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Destination Wallet (To)
          </label>
          <select
            value={formData.toWalletId}
            onChange={(e) => setFormData((prev) => ({ ...prev, toWalletId: e.target.value }))}
            className="input-field cursor-pointer font-medium"
          >
            {wallets
              .filter((w) => w._id !== formData.fromWalletId)
              .map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} (Available: ₹{w.balance})
                </option>
              ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Transfer Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            value={formData.amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            className="input-field text-lg font-bold"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Confirm Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransferModal;
