import React, { useState } from 'react';
import AnalyticsOverview from '../components/analytics/AnalyticsOverview';

/**
 * Analytics Page - Deep dive intelligence and anomaly detection
 */
const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('6M');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">FinPulse Intelligence &amp; Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Automated pattern recognition, anomaly detection, and category allocation audits
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center bg-[#141416] p-1 rounded-xl text-xs font-semibold border border-[#2e2e36]">
          {['1M', '3M', '6M', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-[#d96b43] text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Analytics Overview */}
      <AnalyticsOverview />
    </div>
  );
};

export default AnalyticsPage;
