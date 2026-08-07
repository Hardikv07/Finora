import React from 'react';

/**
 * Finora Logo — Customized for the reference UI color scheme
 * Features a glowing vector spark-emblem in Warm Coral & Pastel Accents
 */
const FinoraLogo = ({ 
  size = 'md', 
  showBadge = true, 
  badgeText = 'AI',
  variant = 'dark', // 'dark' (for dark background) | 'light'
  className = '' 
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', badge: 'text-[10px] px-1.5 py-0.5' },
    md: { icon: 'w-9 h-9', text: 'text-xl', badge: 'text-xs px-2 py-0.5' },
    lg: { icon: 'w-11 h-11', text: 'text-2xl', badge: 'text-xs px-2.5 py-0.5' },
    xl: { icon: 'w-14 h-14', text: 'text-3xl', badge: 'text-sm px-3 py-1' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const textColor = variant === 'light' 
    ? 'text-slate-900' 
    : 'text-white';

  const badgeStyle = variant === 'light'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-[#3b231c] text-[#ea9d85] border-[#543025]';

  return (
    <div className={`flex items-center gap-2.5 font-sans select-none ${className}`}>
      {/* Emblem SVG Icon */}
      <div className={`relative ${currentSize.icon} flex items-center justify-center shrink-0`}>
        {/* Soft background glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#d96b43]/30 via-[#ea9d85]/30 to-[#86c8a7]/30 blur-sm transform scale-110" />
        
        {/* SVG Logo Mark */}
        <svg 
          viewBox="0 0 44 44" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="finoraCoralPrimary" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d96b43" />
              <stop offset="50%" stopColor="#ea9d85" />
              <stop offset="100%" stopColor="#86c8a7" />
            </linearGradient>
            <linearGradient id="finoraCoralAccent" x1="44" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#b09cec" />
              <stop offset="100%" stopColor="#93b4ed" />
            </linearGradient>
          </defs>

          {/* Rounded Squircle Container */}
          <rect x="2" y="2" width="40" height="40" rx="12" fill="url(#finoraCoralPrimary)" />
          
          {/* Subtle Inner Glass Overlay */}
          <rect x="2" y="2" width="40" height="40" rx="12" fill="white" fillOpacity="0.08" />

          {/* Abstract Geometric 'F' + Growth Spark Arrow */}
          <rect x="12" y="11" width="5.5" height="22" rx="2.75" fill="white" />
          
          <path 
            d="M17.5 13.75H28.5C30.433 13.75 32 15.317 32 17.25C32 19.183 30.433 20.75 28.5 20.75H17.5V13.75Z" 
            fill="white" 
          />

          <path 
            d="M17.5 21.5H25C26.3807 21.5 27.5 22.6193 27.5 24C27.5 25.3807 26.3807 26.5 25 26.5H17.5V21.5Z" 
            fill="url(#finoraCoralAccent)" 
          />

          <path 
            d="M29 11L33 7M33 7H29.5M33 7V10.5" 
            stroke="#ffffff" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      {/* Brand Name & Badge */}
      <div className="flex items-center gap-1.5">
        <span className={`${currentSize.text} font-black ${textColor} tracking-tight font-sans`}>
          Finora
        </span>

        {showBadge && (
          <span className={`font-semibold border rounded-lg tracking-wide ${currentSize.badge} ${badgeStyle}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

export default FinoraLogo;
