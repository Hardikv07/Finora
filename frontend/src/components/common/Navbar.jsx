import React from 'react';
import { Bell, Search, Globe, User, Menu, RefreshCw } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { CURRENCIES } from '../../constants/categories';

/**
 * Top Navigation Bar with active page indicators, currency selector, and notification bell
 */
const Navbar = ({ activePage, onToggleSidebar, onQuickSearch }) => {
  const { user, selectedCurrency, setSelectedCurrency, resetData } = useFinanceData();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left side: Mobile menu + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight capitalize">
            {activePage || 'Dashboard'}
          </h1>
          <span className="text-xs text-slate-400 hidden sm:inline-block">
            Finora Enterprise Financial Workspace
          </span>
        </div>
      </div>

      {/* Right side: Search trigger + Currency + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search trigger */}
        <button
          onClick={onQuickSearch}
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/60 rounded-xl text-xs font-medium text-slate-600 transition-all"
          title="Quick Search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Quick Search...</span>
          <span className="ml-1 px-1.5 py-0.5 bg-white text-slate-500 rounded border border-slate-200 font-mono text-[10px]">
            ⌘K
          </span>
        </button>

        {/* Currency Switcher */}
        <div className="relative flex items-center bg-slate-100/80 rounded-xl p-1 border border-slate-200/60">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1 hidden sm:block" />
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 py-1 pr-2 pl-1 rounded-lg focus:outline-none cursor-pointer"
            aria-label="Select display currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={resetData}
          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Reset Demo Data to default state"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
          </button>
        </div>

        {/* User Profile avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-primary-100">
            {user?.name ? user.name.charAt(0) : <User className="w-4 h-4" />}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
              {user?.name || 'John Doe'}
            </p>
            <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Pro Plan
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
