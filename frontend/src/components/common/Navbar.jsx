import React from 'react';
import { Search, Globe, User, Menu, RefreshCw, LogOut } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { CURRENCIES } from '../../constants/categories';
import TransactionSearch from './TransactionSearch';

/**
 * Top Navigation Bar styled with pitch black (#0a0a0c) header
 */
const Navbar = ({ activePage, onToggleSidebar, onOpenQuickAdd, onSelectTransaction, onSearchTermSelect }) => {
  const { user, selectedCurrency, setSelectedCurrency, exchangeRates, resetData } = useFinanceData();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('finora_'))
        .forEach((k) => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-[#26262e] px-4 sm:px-6 flex items-center justify-between gap-4 shadow-sm">
      {/* Left side: Mobile menu toggle + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-[#222228] transition-colors"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-lg font-extrabold text-white tracking-tight capitalize flex items-center gap-2">
            <span>{activePage || 'Dashboard'}</span>
          </h1>
          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline-block">
            Finora Enterprise Financial Workspace
          </span>
        </div>
      </div>

      {/* Right side: Search trigger + Currency + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Smart Transaction Search */}
        <div className="hidden sm:block">
          <TransactionSearch 
            onSelectTransaction={onSelectTransaction}
            onSearchTermSelect={onSearchTermSelect}
          />
        </div>

        {/* Currency Switcher */}
        <div className="relative flex items-center bg-[#1c1c22] rounded-xl p-1 border border-[#2e2e36]">
          <Globe className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1 hidden sm:block" />
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-200 py-1 pr-2 pl-1 rounded-lg focus:outline-none cursor-pointer"
            aria-label="Select display currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-[#1c1c22] text-white">
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
          {selectedCurrency !== 'INR' && exchangeRates[selectedCurrency] && (
            <span className="hidden md:inline-flex text-[10px] text-[#ea9d85] font-medium ml-1 whitespace-nowrap bg-[#3b231c] px-1.5 py-0.5 rounded border border-[#543025]">
              1 {selectedCurrency} = ₹{Math.round(1 / exchangeRates[selectedCurrency]).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={resetData}
          className="p-2 rounded-xl text-slate-400 hover:text-[#ea9d85] hover:bg-[#222228] transition-colors border border-transparent"
          title="Reset Demo Data to default state"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* User Profile avatar & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#26262e]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#d96b43] to-[#ea9d85] flex items-center justify-center text-white font-black text-sm shadow-sm ring-2 ring-[#3b231c]">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] font-semibold text-[#86c8a7] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86c8a7] animate-pulse"></span>
                Pro Plan
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
