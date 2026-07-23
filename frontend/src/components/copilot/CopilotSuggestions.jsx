/**
 * CopilotSuggestions — Starter prompt chips displayed when the chat is empty
 */
import React from 'react';
import { TrendingUp, Target, CreditCard, AlertCircle, BarChart2, ShoppingBag, Repeat, Wallet } from 'lucide-react';

const SUGGESTIONS = [
  { icon: TrendingUp,   text: 'Compare this month with last month', color: 'indigo' },
  { icon: AlertCircle,  text: 'Why did I overspend this month?',     color: 'rose' },
  { icon: ShoppingBag,  text: 'Where am I spending the most money?', color: 'amber' },
  { icon: CreditCard,   text: 'Can I afford an iPhone worth ₹80,000?', color: 'blue' },
  { icon: Target,       text: 'How close am I to my savings goal?',  color: 'emerald' },
  { icon: Repeat,       text: 'Which subscriptions cost me the most?', color: 'purple' },
  { icon: BarChart2,    text: 'Predict my balance at end of month',  color: 'cyan' },
  { icon: Wallet,       text: 'Which wallet do I use the least?',    color: 'slate' },
];

const COLOR_MAP = {
  indigo:  'bg-indigo-500/10 border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/20',
  rose:    'bg-rose-500/10 border-rose-500/25 text-rose-300 hover:bg-rose-500/20',
  amber:   'bg-amber-500/10 border-amber-500/25 text-amber-300 hover:bg-amber-500/20',
  blue:    'bg-blue-500/10 border-blue-500/25 text-blue-300 hover:bg-blue-500/20',
  emerald: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20',
  purple:  'bg-purple-500/10 border-purple-500/25 text-purple-300 hover:bg-purple-500/20',
  cyan:    'bg-cyan-500/10 border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/20',
  slate:   'bg-slate-500/10 border-slate-500/25 text-slate-300 hover:bg-slate-500/20',
};

const CopilotSuggestions = ({ onSelect }) => (
  <div className="px-4 py-3">
    <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3 text-center">
      Try asking Finora Copilot
    </p>
    <div className="grid grid-cols-1 gap-2">
      {SUGGESTIONS.map(({ icon: Icon, text, color }, i) => (
        <button
          key={i}
          onClick={() => onSelect(text)}
          className={`flex items-center gap-2.5 text-left text-xs font-medium px-3 py-2.5 rounded-xl border transition-all ${COLOR_MAP[color] || COLOR_MAP.slate}`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {text}
        </button>
      ))}
    </div>
  </div>
);

export default CopilotSuggestions;
