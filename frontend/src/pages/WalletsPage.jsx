import React, { useState } from 'react';
import { Plus, ArrowLeftRight, Landmark, CreditCard } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { formatCurrency } from '../utils/formatters';
import WalletCards from '../components/wallets/WalletCards';
import WalletFormModal from '../components/wallets/WalletFormModal';
import TransferModal from '../components/wallets/TransferModal';
import Button from '../components/common/Button';

/**
 * Wallets & Accounts Management Page in crisp Dark Palette
 */
const WalletsPage = () => {
  const { wallets, selectedCurrency } = useFinanceData();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [transferFromWallet, setTransferFromWallet] = useState(null);

  const totalNetWorth = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
  const liquidCash = wallets
    .filter((w) => w.type !== 'Credit Card')
    .reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
  const creditDebt = wallets
    .filter((w) => w.type === 'Credit Card' && w.balance < 0)
    .reduce((acc, w) => acc + Math.abs(Number(w.balance) || 0), 0);

  const handleOpenEdit = (w) => {
    setEditingWallet(w);
    setWalletModalOpen(true);
  };

  const handleOpenTransfer = (w) => {
    setTransferFromWallet(w);
    setTransferModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Wallets & Bank Accounts</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Track balances, credit lines, digital pockets, and perform transfers</p>
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
          <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditingWallet(null); setWalletModalOpen(true); }}>
            Add Account
          </Button>
        </div>
      </div>

      {/* Net Worth Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-[#1c1c22] to-[#25252e] border-[#2e2e36] text-white shadow-lg">
          <span className="text-xs font-bold text-[#ea9d85] uppercase tracking-wider block">
            Combined Net Worth
          </span>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-white">
            {formatCurrency(totalNetWorth, selectedCurrency)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Across {wallets.length} active wallets</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border-[#2e2e36]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Liquid Assets</span>
            <Landmark className="w-5 h-5 text-[#86c8a7]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">
            {formatCurrency(liquidCash, selectedCurrency)}
          </p>
          <span className="text-[11px] text-[#86c8a7] font-semibold mt-1 block">Ready for immediate disbursement</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border-[#2e2e36]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credit Liability</span>
            <CreditCard className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-2">
            {formatCurrency(creditDebt, selectedCurrency)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Outstanding credit card balance</span>
        </div>
      </div>

      {/* Main Wallets List */}
      <WalletCards
        onEdit={handleOpenEdit}
        onTransfer={handleOpenTransfer}
      />

      {/* Wallet Modal */}
      <WalletFormModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        initialData={editingWallet}
      />

      {/* Transfer Funds Modal */}
      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        initialFromWallet={transferFromWallet}
      />
    </div>
  );
};

export default WalletsPage;
