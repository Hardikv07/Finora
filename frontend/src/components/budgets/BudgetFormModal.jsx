import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useFinanceData } from '../../hooks/useFinanceData';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { validateBudgetForm } from '../../utils/validators';

/**
 * Modal form for creating a new Category Budget Limit
 */
const BudgetFormModal = ({ isOpen, onClose }) => {
  const { addBudget, budgets } = useFinanceData();
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0]?.name || 'Food & Dining',
    limit: '',
    period: 'Monthly',
    alertThreshold: 85
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateBudgetForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Check if category already has a budget
    const existing = budgets.find((b) => b.category === formData.category);
    if (existing) {
      setErrors({ category: `A budget limit for ${formData.category} already exists. Delete it first to replace.` });
      return;
    }

    setIsSubmitting(true);
    try {
      await addBudget({
        ...formData,
        limit: Number(formData.limit),
        spent: 0,
        alertThreshold: Number(formData.alertThreshold)
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
      title="Set Category Budget Limit"
      subtitle="Establish spending ceilings and automatic warning alerts for any category"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Expense Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input-field cursor-pointer"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1 font-medium">{errors.category}</p>}
        </div>

        {/* Limit Amount */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Budget Ceiling Limit (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            name="limit"
            value={formData.limit}
            onChange={handleChange}
            placeholder="e.g. 15000"
            className="input-field text-lg font-bold"
          />
          {errors.limit && <p className="text-xs text-red-500 mt-1 font-medium">{errors.limit}</p>}
        </div>

        {/* Period & Alert Threshold */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Time Period
            </label>
            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
              className="input-field cursor-pointer"
            >
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
              <option value="Quarterly">Quarterly</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Alert Warning at (%)
            </label>
            <input
              type="number"
              min="50"
              max="95"
              name="alertThreshold"
              value={formData.alertThreshold}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Create Budget Limit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BudgetFormModal;
