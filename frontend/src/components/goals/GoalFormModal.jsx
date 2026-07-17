import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useFinanceData } from '../../hooks/useFinanceData';
import { validateGoalForm } from '../../utils/validators';

/**
 * Modal form for creating a new Savings Goal
 */
const GoalFormModal = ({ isOpen, onClose }) => {
  const { addGoal } = useFinanceData();
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'High',
    category: 'Savings',
    autoContribute: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateGoalForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await addGoal({
        ...formData,
        targetAmount: Number(formData.targetAmount),
        currentAmount: Number(formData.currentAmount || 0)
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
      title="Create New Savings Goal"
      subtitle="Track long-term financial milestones with progress rings and auto-contributions"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Goal Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Emergency Fund, Buy Car, Europe Trip"
            className="input-field"
          />
          {errors.title && <p className="text-xs text-red-500 mt-1 font-medium">{errors.title}</p>}
        </div>

        {/* Target Amount & Initial Pool */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Target Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              name="targetAmount"
              value={formData.targetAmount}
              onChange={handleChange}
              placeholder="e.g. 500000"
              className="input-field font-bold text-lg"
            />
            {errors.targetAmount && <p className="text-xs text-red-500 mt-1 font-medium">{errors.targetAmount}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Already Saved Pool (₹)
            </label>
            <input
              type="number"
              step="any"
              name="currentAmount"
              value={formData.currentAmount}
              onChange={handleChange}
              placeholder="0.00"
              className="input-field font-semibold"
            />
          </div>
        </div>

        {/* Deadline & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Target Completion Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="input-field"
            />
            {errors.deadline && <p className="text-xs text-red-500 mt-1 font-medium">{errors.deadline}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Priority Ranking
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="input-field cursor-pointer font-medium"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Auto Contribute Checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="autoContribute"
            name="autoContribute"
            checked={formData.autoContribute}
            onChange={handleChange}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="autoContribute" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Enable automated monthly contribution alert suggestion
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Save Goal
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GoalFormModal;
