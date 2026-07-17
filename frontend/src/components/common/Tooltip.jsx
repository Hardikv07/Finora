import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Reusable Tooltip component for explaining financial terms
 */
const Tooltip = ({ content, children, position = 'top' }) => {
  const [show, setShow] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2'
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children || <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help transition-colors" />}

      {show && (
        <div
          role="tooltip"
          className={`absolute z-40 px-3 py-2 text-xs font-medium text-white bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl whitespace-nowrap pointer-events-none animate-fade-in ${positions[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
