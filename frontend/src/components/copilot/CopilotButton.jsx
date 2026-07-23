/**
 * CopilotButton — Floating action button that toggles the Copilot panel
 * Shows a pulsing ring animation and badge when panel is closed
 */
import React from 'react';
import { Brain, X } from 'lucide-react';

const CopilotButton = ({ isOpen, onClick }) => (
  <button
    onClick={onClick}
    title={isOpen ? 'Close Finora Copilot' : 'Open Finora Copilot'}
    className={`
      fixed bottom-6 right-6 z-50
      w-14 h-14 rounded-2xl shadow-2xl
      flex items-center justify-center
      transition-all duration-300 ease-out
      hover:scale-110 active:scale-95
      ${isOpen
        ? 'bg-slate-700 hover:bg-slate-600 rotate-0 ring-2 ring-slate-600'
        : 'bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 ring-2 ring-indigo-500/40 shadow-indigo-500/30'}
    `}
    aria-label="Toggle Finora Copilot"
  >
    {/* Pulsing ring when closed */}
    {!isOpen && (
      <span className="absolute inset-0 rounded-2xl ring-2 ring-indigo-400 animate-ping opacity-30" />
    )}
    {isOpen
      ? <X className="w-5 h-5 text-slate-200 transition-transform" />
      : <Brain className="w-6 h-6 text-white" />
    }
  </button>
);

export default CopilotButton;
