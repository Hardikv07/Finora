import React, { useState } from 'react';
import { Plus, ArrowLeftRight, Landmark, CreditCard } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { formatCurrency } from '../utils/formatters';
import Button from '../components/common/Button';
import WalletCards from '../components/wallets/WalletCards';
import WalletFormModal from '../components/wallets/WalletFormModal';
import TransferModal from '../components/wallets/TransferModal';

/**
 * Wallets & Accounts Management Page
 */
const WalletsPage = () => {
  const { wallets, deleteWallet, selectedCurrency } = useFinanceData();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTransferWalletId, setSelectedTransferWalletId] = useState(null);

  const totalNetWorth = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
  const liquidCash = wallets
    .filter((w) => w.type !== 'credit_card')
    .reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
  const creditDebt = wallets
    .filter((w) => w.type === 'credit_card' && w.balance < 0)
    .reduce((acc, w) => acc + Math.abs(Number(w.balance) || 0), 0);

  const handleOpenTransfer = (walletId = null) => {
    setSelectedTransferWalletId(walletId);
    setTransferModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Wallets & Bank Accounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track balances, credit lines, digital pockets, and perform transfers</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeftRight}
            onClick={() => handleOpenTransfer(null)}
          >
            Transfer Funds
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setWalletModalOpen(true)}>
            Add Account
          </Button>
        </div>
      </div>

      {/* Net Worth Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-lg">
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block">
            Combined Net Worth
          </span>
          <p className="text-2xl sm:text-3xl font-black mt-2">
            {formatCurrency(totalNetWorth, selectedCurrency)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Across {wallets.length} active wallets</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border-emerald-100/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Liquid Assets</span>
            <Landmark className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {formatCurrency(liquidCash, selectedCurrency)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Ready for immediate disbursement</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border-rose-100/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credit Card Outstanding</span>
            <CreditCard className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
            {formatCurrency(creditDebt, selectedCurrency)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Scheduled for auto-debit</span>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Active Wallets</h3>
        <WalletCards onTransfer={handleOpenTransfer} onDelete={deleteWallet} />
      </div>

      {/* Modals */}
      <WalletFormModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        initialFromWalletId={selectedTransferWalletId}
      />
    </div>
  );
};

export default WalletsPage;
