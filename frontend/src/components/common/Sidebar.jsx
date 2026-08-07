import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  Repeat,
  BarChart3,
  ShieldCheck,
  X,
  Sparkles
} from 'lucide-react';
import FinoraLogo from './FinoraLogo';

/**
 * Sidebar Navigation styled with pitch black background (#0a0a0c) & terracotta accents
 */
const Sidebar = ({ activePage, onNavigate, isOpen, onClose }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'wallets', label: 'Wallets & Accounts', icon: Wallet },
    { id: 'budgets', label: 'Budget System', icon: PieChart },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'recurring', label: 'Recurring & Bills', icon: Repeat },
    { id: 'analytics', label: 'Analytics & AI', icon: BarChart3 }
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar container - Pitch Black Theme */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0c] border-r border-[#26262e] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#26262e] shrink-0">
          <FinoraLogo size="md" variant="dark" badgeText="AI" />

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1a20] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3.5 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Core Modules
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#d96b43] text-white shadow-md shadow-[#d96b43]/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#18181f]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#ea9d85]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* AI Insight Card */}
        <div className="p-4 m-3 bg-[#17171c] rounded-2xl border border-[#2d2d38] shadow-sm">
          <div className="flex items-center gap-2 text-[#ea9d85] font-bold text-xs mb-1.5">
            <Sparkles className="w-4 h-4 text-[#d96b43] animate-pulse" />
            <span>FinPulse AI Active</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            Precision financial rules and multi-entity RAG matching your transactions.
          </p>
        </div>

        {/* Footer Security Badge */}
        <div className="p-4 border-t border-[#26262e] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#86c8a7]" />
            <span className="font-medium text-slate-400">256-bit Encrypted</span>
          </div>
          <span className="font-mono text-[10px] bg-[#18181f] text-slate-400 px-2 py-0.5 rounded-full border border-[#2d2d38]">v2.4.0</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
