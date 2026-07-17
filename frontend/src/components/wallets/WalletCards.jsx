import React from 'react';
import { Landmark, CreditCard, Wallet as WalletIcon, Coins, Trash2, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { formatCurrency } from '../../utils/formatters';

/**
 * Modern credit card and bank account cards grid for Wallets module
 */
const WalletCards = ({ onTransfer, onDelete }) => {
  const { wallets, selectedCurrency } = useFinanceData();

  const getWalletIcon = (type) => {
    switch (type) {
      case 'credit_card':
        return CreditCard;
      case 'digital_wallet':
        return WalletIcon;
      case 'cash':
        return Coins;
      default:
        return Landmark;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wallets.map((w) => {
        const Icon = getWalletIcon(w.type);
        const isCredit = w.type === 'credit_card';

        return (
          <div
            key={w._id}
            className={`rounded-3xl p-6 bg-gradient-to-tr ${
              w.color || 'from-slate-800 to-slate-900'
            } text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-56 group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl`}
          >
            {/* Background decoration circles */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute right-6 top-6 w-12 h-12 rounded-full bg-white/10 blur-sm pointer-events-none" />

            {/* Top Bar: Icon + Name + Primary Badge */}
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight tracking-tight">{w.name}</h3>
                  <p className="text-xs text-white/70 capitalize mt-0.5">{w.type?.replace('_', ' ')}</p>
                </div>
              </div>

              {w.isPrimary && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Primary
                </span>
              )}
            </div>

            {/* Middle: Masked Account Number */}
            <div className="relative z-10 my-4">
              <p className="font-mono text-sm tracking-widest text-white/80">
                {w.accountNumber || '**** **** **** 1024'}
              </p>
            </div>

            {/* Bottom: Balance & Actions */}
            <div className="flex items-end justify-between gap-4 relative z-10 pt-2 border-t border-white/10">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70 block">
                  {isCredit ? 'Current Outstanding' : 'Available Balance'}
                </span>
                <span className="text-2xl font-black tracking-tight">
                  {formatCurrency(w.balance, selectedCurrency)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onTransfer(w._id)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors"
                  title="Transfer Funds from this wallet"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
                {wallets.length > 1 && (
                  <button
                    onClick={() => onDelete(w._id)}
                    className="p-2 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 backdrop-blur-md text-white transition-colors"
                    title="Delete Wallet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WalletCards;
