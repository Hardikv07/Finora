import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Pagination component for tables and lists
 */
const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (totalItems <= itemsPerPage) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
      <span className="text-xs text-slate-500 font-medium">
        Showing <span className="text-slate-800 font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
        <span className="text-slate-800 font-semibold">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
        <span className="text-slate-800 font-semibold">{totalItems}</span> entries
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-semibold px-3 py-1 bg-primary-50 text-primary-700 rounded-md">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
