import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency } from '../../utils/formatters';

/**
 * Modal for adding contributions directly into a Savings Goal from a wallet
 */
const ContributeModal = ({ isOpen, onClose, goal = null }) => {
  const { wallets, contributeGoal, selectedCurrency } = useFinanceData();
  const [walletId, setWalletId] = useState(wallets[0]?._id || '');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid positive contribution amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await contributeGoal({
        goalId: goal._id,
        walletId,
        amount: Number(amount)
      });
      onClose();
    } catch (err) {
      setError('Failed to process contribution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!goal) return null;

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Contribute to: ${goal.title}`}
      subtitle={`Remaining needed: ${formatCurrency(remaining, selectedCurrency)} to reach full target`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Source Wallet */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Deduct Funds From Wallet <span className="text-red-500">*</span>
          </label>
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="input-field cursor-pointer font-medium"
          >
            {wallets.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} (Available: ₹{w.balance})
              </option>
            ))}
          </select>
        </div>

        {/* Contribution Amount */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Contribution Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Suggested: ${Math.min(remaining, 15000)}`}
            className="input-field text-lg font-bold"
          />
        </div>

        {/* Quick percentage helper chips */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 font-medium">Quick Fill:</span>
          {[2500, 5000, 10000, remaining].filter(Boolean).map((val, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAmount(String(val))}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              ₹{val}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Add Funds to Goal
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ContributeModal;
