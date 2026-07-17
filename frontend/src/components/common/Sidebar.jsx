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

/**
 * Navigation Sidebar with Lucide icons, responsive drawer support, and system status badge
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
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 font-black text-lg">
              F
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                Finora <span className="text-xs font-semibold px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md">AI</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3.5 py-6 space-y-1 overflow-y-auto">
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
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* AI Insight Box / Upgrade Pro Banner */}
        <div className="p-4 m-3 bg-gradient-to-br from-slate-800 to-slate-800/80 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1.5">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>FinPulse AI Active</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Automatic rule engine & anomaly detection are running to optimize your wealth.
          </p>
        </div>

        {/* Footer info & System security */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>256-bit Encrypted</span>
          </div>
          <span className="font-mono text-[10px]">v2.4.0</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
