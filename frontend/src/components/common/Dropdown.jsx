import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Reusable custom Dropdown component with clean option highlight
 */
const Dropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  icon: Icon,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value || opt.id === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm gap-2"
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
          {selectedOption ? selectedOption.label || selectedOption.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-1.5 w-full min-w-[180px] origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none py-1.5 animate-fade-in max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const optVal = opt.value ?? opt.id;
            const isSelected = value === optVal;
            return (
              <button
                key={optVal}
                type="button"
                onClick={() => {
                  onChange(optVal);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-sm flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="truncate">{opt.label || opt.name}</span>
                {isSelected && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
