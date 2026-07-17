import React from 'react';

/**
 * Shimmer Loading Skeleton for metric cards
 */
export const CardSkeleton = () => {
  return (
    <div className="glass-card rounded-2xl p-6 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-slate-200 rounded-xl"></div>
      </div>
      <div className="h-8 bg-slate-300 rounded w-2/3"></div>
      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
    </div>
  );
};

/**
 * Shimmer Loading Skeleton for tables
 */
export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100 border-b border-slate-200"></div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 w-1/3">
              <div className="h-10 w-10 rounded-xl bg-slate-200 shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-300 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            <div className="h-6 bg-slate-300 rounded-full w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Full Dashboard loading skeleton view
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 h-80 bg-slate-100/50"></div>
        <div className="glass-card rounded-2xl p-6 h-80 bg-slate-100/50"></div>
      </div>
    </div>
  );
};
