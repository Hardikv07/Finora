import React, { useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import Button from '../components/common/Button';
import RecurringList from '../components/recurring/RecurringList';
import RecurringFormModal from '../components/recurring/RecurringFormModal';

/**
 * Recurring Subscriptions & Salaries Page
 */
const RecurringPage = () => {
  const { deleteRecurring } = useFinanceData();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Recurring Schedules & Subscriptions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Automate fixed salary deposits, streaming services, house rent, and recurring utility bills</p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
          Add Schedule
        </Button>
      </div>

      {/* Recurring List */}
      <RecurringList onDelete={deleteRecurring} />

      {/* Modal */}
      <RecurringFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default RecurringPage;
