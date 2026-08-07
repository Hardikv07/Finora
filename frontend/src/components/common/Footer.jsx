import React from 'react';

/**
 * Clean Dark Footer matching pitch black theme
 */
const Footer = () => {
  return (
    <footer className="mt-auto border-t border-[#26262e] bg-[#0a0a0c] py-6 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-medium">
          <span>&copy; {new Date().getFullYear()} Finora SaaS Workspace. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-[#86c8a7] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#86c8a7] animate-pulse"></span>
            Real-Time Sync Engine Active
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            Built for High Performance
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
