import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { apiService } from '../../services/api';

const TransactionSearch = ({ onSelectTransaction, onSearchTermSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [matchedTransactions, setMatchedTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Debounce API calls
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        setMatchedTransactions([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const [results, txResults] = await Promise.all([
          apiService.getSearchSuggestions(query),
          apiService.searchTransactions(query)
        ]);
        setSuggestions(results);
        setMatchedTransactions(txResults || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    const totalCount = suggestions.length + matchedTransactions.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalCount - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (selectedIndex >= suggestions.length && selectedIndex < totalCount) {
        handleSelectTransaction(matchedTransactions[selectedIndex - suggestions.length]);
      } else if (query) {
        handleSelectSuggestion(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setQuery('');
    setIsOpen(false);
    if (onSearchTermSelect) {
      onSearchTermSelect(suggestion);
    }
  };

  const handleSelectTransaction = (tx) => {
    setQuery('');
    setIsOpen(false);
    if (onSelectTransaction) {
      onSelectTransaction(tx);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setMatchedTransactions([]);
    setIsOpen(false);
  };

  // Utility function for text highlighting
  const renderHighlightedText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-amber-400 text-slate-950 rounded px-0.5 font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#d96b43]" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && (suggestions.length > 0 || matchedTransactions.length > 0)) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search transactions, tags, categories..."
          className="w-full pl-9 pr-8 py-2 bg-[#1c1c22] border border-[#2e2e36] rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d96b43]/40 focus:border-[#d96b43] transition-all shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-white text-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && query.trim() !== '' && (
        <div className="absolute mt-1 w-full bg-[#1c1c22] rounded-xl shadow-2xl z-50 border border-[#2e2e36] transition-all duration-200 p-1.5">
          <div className="max-h-80 overflow-auto text-xs">
            {/* Section 1: Suggestions */}
            {suggestions.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold text-[#ea9d85] uppercase tracking-wider">Search Keywords</div>
                {suggestions.map((suggestion, index) => {
                  const isCurrent = index === selectedIndex;
                  return (
                    <div
                      key={`s-${index}`}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`cursor-pointer select-none relative py-1.5 pl-3 pr-9 rounded-lg transition-colors ${
                        isCurrent 
                          ? 'bg-[#3b231c] text-[#ea9d85] font-bold border border-[#543025]' 
                          : 'text-white hover:bg-[#25252e]'
                      }`}
                    >
                      <div className="flex items-center text-xs">
                        <Search className="h-3 w-3 mr-2 text-slate-400" />
                        <span className="block truncate">
                          {renderHighlightedText(suggestion, query)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Section 2: Transactions */}
            {matchedTransactions.length > 0 && (
              <div className="py-1 border-t border-[#2e2e36] mt-1 pt-1.5">
                <div className="px-3 py-1 text-[10px] font-bold text-[#ea9d85] uppercase tracking-wider">Matching Transactions</div>
                {matchedTransactions.map((tx, index) => {
                  const adjustedIndex = index + suggestions.length;
                  const isCurrent = adjustedIndex === selectedIndex;
                  const isIncome = tx.type?.toLowerCase() === 'income';
                  return (
                    <div
                      key={`t-${tx._id}`}
                      onClick={() => handleSelectTransaction(tx)}
                      onMouseEnter={() => setSelectedIndex(adjustedIndex)}
                      className={`cursor-pointer select-none relative py-1.5 px-3 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                        isCurrent 
                          ? 'bg-[#3b231c] text-white font-bold border border-[#543025]' 
                          : 'text-white hover:bg-[#25252e]'
                      }`}
                    >
                      <div className="flex items-center min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mr-2 text-[10px] font-bold ${
                          isIncome ? 'bg-[#1d2622] text-[#86c8a7]' : 'bg-[#2b1c1d] text-[#f87171]'
                        }`}>
                          {isIncome ? '+' : '-'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate text-white">
                            {renderHighlightedText(tx.merchant || 'General Entry', query)}
                          </p>
                          <p className="text-[9px] text-slate-400 capitalize">
                            {tx.category} • {new Date(tx.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-black shrink-0 ${isIncome ? 'text-[#86c8a7]' : 'text-[#f87171]'}`}>
                        ₹{tx.amount?.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {suggestions.length === 0 && matchedTransactions.length === 0 && !loading && (
              <div className="text-slate-400 cursor-default select-none relative py-6 text-center italic text-xs font-medium">
                No matching keywords or transactions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionSearch;
