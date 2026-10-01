import React from 'react';

/**
 * AeroRent Architectural Monogram Logo
 * Handcrafted geometric dual-floor icon representing 7 rooms across 2 levels
 * Perfectly optimized for High Contrast in both Light and Dark themes
 */
export default function AeroRentLogo({ size = 'md', showSubtitle = true, className = '' }) {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const iconDimensions = isSmall 
    ? 'w-8 h-8' 
    : isLarge 
      ? 'w-14 h-14' 
      : 'w-10 h-10';

  const titleSize = isSmall 
    ? 'text-sm' 
    : isLarge 
      ? 'text-2xl' 
      : 'text-base';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Handcrafted Geometric Architectural Brand Mark */}
      <div className={`relative ${iconDimensions} rounded-2xl flex items-center justify-center p-0.5 shadow-md dark:shadow-[0_0_24px_rgba(56,189,248,0.35)] dark:border dark:border-sky-400/40 transition-transform group-hover:scale-105 duration-300 flex-shrink-0`}>
        {/* Layered Gradient Background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-500 dark:via-blue-600 dark:to-indigo-500 shadow-inner"></div>
        
        {/* Subtle Glass Sheen Overlay */}
        <div className="absolute inset-[1px] rounded-[15px] bg-gradient-to-b from-white/35 via-transparent to-transparent pointer-events-none"></div>

        {/* Bespoke Architectural Vector Icon */}
        <svg 
          viewBox="0 0 36 36" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="relative z-10 w-[72%] h-[72%] text-white drop-shadow-sm"
        >
          {/* Roof Apex & Ridge */}
          <path 
            d="M18 4L4 14H32L18 4Z" 
            fill="#ffffff" 
            fillOpacity="0.98" 
          />
          {/* 2nd Floor (Upper Level - 3 Rooms) */}
          <rect x="7" y="15.5" width="22" height="7" rx="1.5" fill="#ffffff" fillOpacity="0.92" />
          <line x1="14" y1="17" x2="14" y2="21" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="22" y1="17" x2="22" y2="21" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
          
          {/* 1st Floor (Lower Level - 4 Rooms) */}
          <rect x="5.5" y="24" width="25" height="7.5" rx="1.5" fill="#ffffff" fillOpacity="0.98" />
          <line x1="12" y1="25.5" x2="12" y2="30" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="18" y1="25.5" x2="18" y2="30" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="24" y1="25.5" x2="24" y2="30" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />

          {/* Golden Center Accent Dot */}
          <circle cx="18" cy="9.5" r="1.5" fill="#facc15" />
        </svg>
      </div>

      {/* Brand Name & Subtitle Typography */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className={`${titleSize} font-extrabold tracking-tight transition-colors`}>
            {/* Aero: High-contrast white in dark mode, slate-900 in light mode */}
            <span className="logo-title-aero text-slate-900 dark:text-white">Aero</span>
            {/* Rent: Vibrant cyan/sky blue */}
            <span className="logo-title-rent text-sky-600 dark:text-sky-400">Rent</span>
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/20 dark:border-sky-400/40 dark:shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            PRO
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400 -mt-0.5">
            7 Rooms • 2 Floors Rental Suite
          </span>
        )}
      </div>
    </div>
  );
}
