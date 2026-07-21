import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { apiService } from '../../services/api';

const TransactionSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Debounce API calls
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const results = await apiService.getSearchSuggestions(query);
        setSuggestions(results);
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

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (query) {
        handleSelectSuggestion(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion);
    setIsOpen(false);
    // Here you could trigger a navigation to a search results page or filter the dashboard
    console.log("Selected:", suggestion);
    // Example: window.location.href = `/transactions?search=${encodeURIComponent(suggestion)}`;
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  // Helper to highlight matching prefix
  const renderHighlightedText = (text, highlight) => {
    if (!highlight.trim()) return text;
    
    // We want to highlight the part that matches the query.
    // For fuzzy matches, it might be tricky, but we'll use a regex for exact substrings.
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
        <div className="absolute mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5 overflow-hidden border dark:border-gray-700 transition-all duration-200">
          <ul className="max-h-60 overflow-auto py-1 text-base sm:text-sm">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`cursor-pointer select-none relative py-2 pl-4 pr-9 transition-colors ${
                    index === selectedIndex 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                      : 'text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <Search className="h-3 w-3 mr-2 text-gray-400" />
                    <span className="block truncate">
                      {renderHighlightedText(suggestion, query)}
                    </span>
                  </div>
                </li>
              ))
            ) : !loading ? (
              <li className="text-gray-500 dark:text-gray-400 cursor-default select-none relative py-3 pl-4 pr-9 text-center italic">
                No results found
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TransactionSearch;
