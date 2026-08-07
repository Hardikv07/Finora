import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import RecurringList from '../components/recurring/RecurringList';
import RecurringFormModal from '../components/recurring/RecurringFormModal';
import Button from '../components/common/Button';

/**
 * Recurring Transactions & Bills Page in crisp Dark Palette
 */
const RecurringPage = () => {
  const { deleteRecurring } = useFinanceData();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Recurring Schedules & Subscriptions</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Automate fixed salary deposits, streaming services, house rent, and recurring utility bills</p>
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
