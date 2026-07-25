import React, { useState } from 'react';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';
import AnalyticsOverview from '../components/analytics/AnalyticsOverview';

/**
 * Analytics Page - Deep dive intelligence and anomaly detection
 */
const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('6M'); // '1M' | '3M' | '6M' | '1Y'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">FinPulse Intelligence &amp; Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated pattern recognition, anomaly detection, and category allocation audits
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {['1M', '3M', '6M', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
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
