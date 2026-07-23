import React, { useState, useEffect, useRef, useCallback } from 'react';
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
        setSelectedIndex(-1); // reset selection
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

  // Helper to highlight matching prefix
  const renderHighlightedText = (text, highlight) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="font-bold text-indigo-600 dark:text-indigo-400">{part}</span> : <span key={i}>{part}</span>
    );
  };

  return (
    <div className="relative w-full max-w-md" ref={wrapperRef}>
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow shadow-sm"
          placeholder="Search transactions, merchants, tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query) setIsOpen(true) }}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 text-gray-400"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && query.trim() !== '' && (
        <div className="absolute mt-1 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg z-50 ring-1 ring-black ring-opacity-5 overflow-hidden border dark:border-gray-700 transition-all duration-200 p-1.5">
          <div className="max-h-80 overflow-auto text-base sm:text-sm">
            
            {/* Section 1: Suggestions */}
            {suggestions.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Keywords</div>
                {suggestions.map((suggestion, index) => {
                  const isCurrent = index === selectedIndex;
                  return (
                    <div
                      key={`s-${index}`}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`cursor-pointer select-none relative py-1.5 pl-3 pr-9 rounded-lg transition-colors ${
                        isCurrent 
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' 
                          : 'text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center text-xs">
                        <Search className="h-3 w-3 mr-2 text-gray-400" />
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
              <div className="py-1 border-t border-slate-100 dark:border-gray-700/50 mt-1 pt-1.5">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matching Transactions</div>
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
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' 
                          : 'text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mr-2 text-[10px] font-bold ${
                          isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isIncome ? '+' : '-'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate text-slate-800 dark:text-slate-200">
                            {renderHighlightedText(tx.merchant || 'General Entry', query)}
                          </p>
                          <p className="text-[9px] text-slate-400 capitalize">
                            {tx.category} • {new Date(tx.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-black shrink-0 ${isIncome ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}`}>
                        ₹{tx.amount?.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
 
            {suggestions.length === 0 && matchedTransactions.length === 0 && !loading && (
              <div className="text-gray-500 dark:text-gray-400 cursor-default select-none relative py-6 text-center italic text-xs">
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
