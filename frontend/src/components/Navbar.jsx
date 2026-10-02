import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  Building2, 
  Receipt, 
  FileSpreadsheet, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import AeroRentLogo from './AeroRentLogo';

export default function Navbar({
  activeTab,
  setActiveTab,
  onLogout,
  theme,
  toggleTheme,
  isLiveApi = false,
  isCloudSyncing = false
}) {
  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'utilities', label: 'Utility Split', icon: Zap },
    { id: 'rooms', label: 'Rooms & Tenants', icon: Building2 },
    { id: 'ledger', label: 'Ledger & Dues', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  // Sliding Blue Box Active Indicator State & Refs
  const navRef = useRef(null);
  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 4, width: 0, opacity: 0 });

  const updateIndicatorPosition = () => {
    const currentTabEl = tabRefs.current[activeTab];
    const navEl = navRef.current;
    if (currentTabEl && navEl) {
      const tabRect = currentTabEl.getBoundingClientRect();
      const navRect = navEl.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - navRect.left,
        width: tabRect.width,
        height: tabRect.height,
        opacity: 1
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicatorPosition();
  }, [activeTab]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicatorPosition);
    const timer = setTimeout(updateIndicatorPosition, 50);
    return () => {
      window.removeEventListener('resize', updateIndicatorPosition);
      clearTimeout(timer);
    };
  }, [activeTab]);

  // Profile Popup Dropdown State & Click-outside Ref
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsProfileOpen(false);
  };

  return (
    <>
      {/* Top Sticky Header */}
      <header className="sticky top-2 sm:top-4 z-40 mx-auto max-w-7xl px-3 sm:px-6 mb-4 sm:mb-6">
        <div className="glass-modal rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 border border-slate-200/80 dark:border-white/15 shadow-xl transition-all">
          
          {/* Brand & Property Identity */}
          <div 
            onClick={() => handleTabClick('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group select-none flex-shrink-0"
            title="AeroRent Dashboard"
          >
            <AeroRentLogo size="sm" showSubtitle={false} />
          </div>

          {/* Desktop Navigation Tabs with Directional Sliding Blue Box Animation */}
          <nav 
            ref={navRef} 
            className="hidden lg:flex relative items-center p-1 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10"
          >
            {/* The Animated Sliding Blue Box Pill */}
            <div 
              className="absolute top-1 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 shadow-md shadow-sky-600/35 border border-sky-400/40 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{
                transform: `translateX(${indicatorStyle.left}px)`,
                width: `${indicatorStyle.width}px`,
                height: `${indicatorStyle.height || 34}px`,
                opacity: indicatorStyle.opacity
              }}
            />

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => (tabRefs.current[item.id] = el)}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative z-10 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors duration-200 cursor-pointer select-none ${
                    isActive
                      ? 'text-white drop-shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/40 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Section: Theme Toggle & [P] Avatar with Sign Out Popup */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle Theme"
              className="w-8 h-8 rounded-xl glass-card flex items-center justify-center text-slate-700 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-slate-200/80 dark:border-white/10 shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-sky-600" />
              )}
            </button>

            {/* Property Admin Interactive [P] Logo with Minimal Sign Out Popup */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                type="button"
                aria-label="Property Admin Menu"
                title="Property Admin"
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs transition-all cursor-pointer shadow-sm ${
                  isProfileOpen
                    ? 'bg-gradient-to-tr from-sky-600 to-blue-600 text-white ring-2 ring-sky-400 shadow-md shadow-sky-500/30 scale-105'
                    : 'bg-gradient-to-tr from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-sky-300 hover:scale-105 active:scale-95 border border-sky-400/30 dark:border-sky-400/40'
                }`}
              >
                P
              </button>

              {/* Minimal Animated Pop-Up Menu (Only Sign Out Option) */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl glass-modal p-1.5 border border-slate-200/80 dark:border-white/15 shadow-2xl z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 ease-out origin-top-right">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/25 border border-rose-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Preserved for Mobile UX) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] select-none ${
                isActive 
                  ? 'text-sky-600 dark:text-sky-400 font-bold scale-105' 
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

