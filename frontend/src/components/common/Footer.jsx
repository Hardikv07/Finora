import React from 'react';
import { Heart, Shield, Terminal } from 'lucide-react';

/**
 * Clean Footer with copyright and security status
 */
const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/60 backdrop-blur-sm py-6 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2 font-medium">
          <span>&copy; {new Date().getFullYear()} Finora SaaS Workspace. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-Time Sync Engine Active
          </span>
          <span className="flex items-center gap-1">
            Built for High Performance
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
