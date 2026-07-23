import React, { useState } from 'react';
import Navbar from '../common/Navbar';
import Sidebar from '../common/Sidebar';
import Footer from '../common/Footer';
import Toast from '../common/Toast';
import { useToast } from '../../hooks/useToast';
import TransactionFormModal from '../transactions/TransactionFormModal';
import CopilotButton from '../copilot/CopilotButton';
import CopilotPanel from '../copilot/CopilotPanel';

/**
 * Main application layout wrapping responsive Sidebar, top Navbar, and dynamic page views
 */
const MainLayout = ({ activeTab, onTabChange, globalSearchQuery, setGlobalSearchQuery, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [txModal, setTxModal] = useState({ isOpen: false, data: null });
  const [copilotOpen, setCopilotOpen] = useState(false);
  const { toasts, removeToast } = useToast();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Toast notifications container */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
          </div>
        ))}
      </div>

      <div className="flex flex-1 min-h-screen">
        {/* Responsive Sidebar */}
        <Sidebar
          activePage={activeTab}
          onNavigate={(tab) => {
            onTabChange(tab);
            setSidebarOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pl-64">
          {/* Top Navbar */}
          <Navbar
            activePage={activeTab}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onOpenQuickAdd={() => setTxModal({ isOpen: true, data: null })}
            onSelectTransaction={(tx) => setTxModal({ isOpen: true, data: tx })}
            onSearchTermSelect={(term) => {
              setGlobalSearchQuery(term);
              onTabChange('transactions');
            }}
          />

          {/* Page Body Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>

      {/* Global Transaction Modal */}
      <TransactionFormModal
        isOpen={txModal.isOpen}
        onClose={() => setTxModal({ isOpen: false, data: null })}
        initialData={txModal.data}
      />

      {/* Finora Copilot */}
      <CopilotButton isOpen={copilotOpen} onClick={() => setCopilotOpen(o => !o)} />
      <CopilotPanel isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
};

export default MainLayout;
