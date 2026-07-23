/**
 * CopilotMessage — Renders a single chat message (user or assistant)
 * Includes: answer text, info cards, inline charts, follow-up chips, confidence badge
 */
import React from 'react';
import { Sparkles, User, TrendingUp, TrendingDown, Minus, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import CopilotChart from './CopilotChart';

// ─── Card colors ──────────────────────────────────────────────────────────────
const CARD_COLORS = {
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300',
  rose:    'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-300',
  amber:   'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300',
  blue:    'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-300',
  indigo:  'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 text-indigo-300',
};

// ─── Trend badge ──────────────────────────────────────────────────────────────
const TrendBadge = ({ trend }) => {
  if (!trend) return null;
  const isPos = trend.startsWith('+');
  const isNeg = trend.startsWith('-');
  return (
    <span className={`text-xs font-bold flex items-center gap-0.5 ${isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-400'}`}>
      {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {trend}
    </span>
  );
};

// ─── Info Card ────────────────────────────────────────────────────────────────
const InfoCard = ({ label, value, trend, color = 'indigo' }) => (
  <div className={`rounded-xl border bg-gradient-to-br p-3 ${CARD_COLORS[color] || CARD_COLORS.indigo}`}>
    <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mb-1">{label}</p>
    <p className="text-base font-black text-white">{value}</p>
    {trend && <TrendBadge trend={trend} />}
  </div>
);

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
const renderAnswer = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return <li key={i} className="text-slate-300 text-sm leading-relaxed ml-2">{line.slice(2)}</li>;
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="text-white font-bold text-sm">{line.slice(2, -2)}</p>;
    }
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="text-slate-300 text-sm leading-relaxed">{line}</p>;
  });
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
export const CopilotLoadingSkeleton = () => (
  <div className="flex gap-3 px-4 py-3">
    <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
      <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
    </div>
    <div className="flex-1 space-y-2.5 pt-1">
      <div className="h-3 bg-slate-700/60 rounded-full animate-pulse w-3/4" />
      <div className="h-3 bg-slate-700/60 rounded-full animate-pulse w-full" />
      <div className="h-3 bg-slate-700/60 rounded-full animate-pulse w-2/3" />
      <div className="flex gap-2 mt-3">
        <div className="h-16 bg-slate-700/40 rounded-xl animate-pulse w-28" />
        <div className="h-16 bg-slate-700/40 rounded-xl animate-pulse w-28" />
      </div>
    </div>
  </div>
);

// ─── Main Message Component ───────────────────────────────────────────────────
const CopilotMessage = ({ message, onFollowUp }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="flex items-end gap-2 max-w-[85%]">
          <div className="bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm shadow-lg">
            {message.content}
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-3 px-4 py-3 group">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${message.isError ? 'bg-rose-500/20' : 'bg-indigo-500/20 ring-1 ring-indigo-500/30'}`}>
        <Sparkles className={`w-4 h-4 ${message.isError ? 'text-rose-400' : 'text-indigo-400'}`} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Answer text */}
        <div className={`${message.isError ? 'text-rose-300' : ''}`}>
          {renderAnswer(message.content)}
        </div>

        {/* Highlights */}
        {message.highlights?.length > 0 && (
          <div className="mt-3 space-y-1">
            {message.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-indigo-400 font-bold mt-0.5">→</span>
                {h}
              </div>
            ))}
          </div>
        )}

        {/* Info Cards */}
        {message.cards?.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {message.cards.map((card, i) => (
              <InfoCard key={i} {...card} />
            ))}
          </div>
        )}

        {/* Charts */}
        {message.charts?.map((chart, i) => (
          <div key={i} className="mt-1">
            <CopilotChart chart={chart} />
          </div>
        ))}

        {/* Follow-up suggestions */}
        {message.followUps?.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Ask Next</p>
            <div className="flex flex-wrap gap-1.5">
              {message.followUps.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUp?.(q)}
                  className="text-xs text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer: confidence + copy + time */}
        <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {message.confidence && (
            <span className="text-[10px] text-slate-500">
              Confidence: {message.confidence}%
            </span>
          )}
          {message.processingMs && (
            <span className="text-[10px] text-slate-600">{message.processingMs}ms</span>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors ml-auto"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopilotMessage;
