/**
 * CopilotPanel — The main slide-over chat panel for Finora Copilot
 * Features: conversation history, auto-scroll, typing animation, follow-ups
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Trash2, Sparkles, Send, Loader2, Brain } from 'lucide-react';
import { useCopilot } from '../../hooks/useCopilot';
import CopilotMessage, { CopilotLoadingSkeleton } from './CopilotMessage';
import CopilotSuggestions from './CopilotSuggestions';

const CopilotPanel = ({ isOpen, onClose }) => {
  const { messages, isLoading, sendMessage, clearChat } = useCopilot();
  const [inputValue, setInputValue] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue('');
    sendMessage(text);
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionSelect = (text) => {
    sendMessage(text);
  };

  const handleFollowUp = (text) => {
    sendMessage(text);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out
          w-full sm:w-[420px]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          background: 'linear-gradient(160deg, #0f172a 0%, #111827 50%, #0f172a 100%)',
          borderLeft: '1px solid rgba(99,102,241,0.15)',
          boxShadow: isOpen ? '-8px 0 40px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 ring-1 ring-indigo-500/40 flex items-center justify-center">
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Finora Copilot</p>
              <p className="text-[10px] text-indigo-400 mt-0.5">AI Financial Analyst</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
          {messages.length === 0 && !isLoading ? (
            <>
              {/* Welcome header */}
              <div className="px-4 pt-6 pb-2 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/25">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-base font-bold text-white">Hi, I'm Finora Copilot</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Ask me anything about your finances. I analyze your real data — no guessing.
                </p>
              </div>
              <CopilotSuggestions onSelect={handleSuggestionSelect} />
            </>
          ) : (
            <div className="py-2">
              {messages.map((msg) => (
                <CopilotMessage
                  key={msg.id}
                  message={msg}
                  onFollowUp={handleFollowUp}
                />
              ))}
              {isLoading && <CopilotLoadingSkeleton />}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="shrink-0 px-3 py-3 border-t border-white/5">
          <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances..."
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
            >
              {isLoading
                ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                : <Send className="w-3.5 h-3.5 text-white" />
              }
            </button>
          </div>
          <p className="text-[10px] text-slate-600 text-center mt-2">
            Powered by Gemini · Analyzes real transaction data
          </p>
        </div>
      </div>
    </>
  );
};

export default CopilotPanel;
