import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  Building2, 
  Receipt, 
  FileSpreadsheet, 
  LogOut,
  Sun,
  Moon,
  Languages,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import AeroRentLogo from './AeroRentLogo';
import NotificationCenter from './NotificationCenter';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({
  activeTab,
  setActiveTab,
  onLogout,
  theme,
  toggleTheme,
  isLiveApi = false,
  isCloudSyncing = false,
  lastSyncedAt = null,
  onManualSync,
  onResetApp,
  gitCommit = 'latest',
  onCheckUpdate,
  notifications = [],
  unreadCount = 0,
  notificationPrefs = { enabled: true, sound: true, duesAlerts: true, cloudAlerts: true },
  onUpdateNotificationPrefs,
  onMarkAllRead,
  onClearAllNotifications,
  onDismissNotification,
  onNotificationAction
}) {
  const { language, setLanguage, t } = useLanguage();

  // Navigation Items with Multi-language Labels
  const navItems = [
    { id: 'dashboard', label: t('nav_dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'utilities', label: t('nav_utilities', 'Utility Split'), icon: Zap },
    { id: 'rooms', label: t('nav_rooms', 'Rooms & Tenants'), icon: Building2 },
    { id: 'ledger', label: t('nav_ledger', 'Ledger & Dues'), icon: Receipt },
    { id: 'reports', label: t('nav_reports', 'Reports'), icon: FileSpreadsheet },
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
  }, [activeTab, language]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicatorPosition);
    const timer = setTimeout(updateIndicatorPosition, 60);
    return () => {
      window.removeEventListener('resize', updateIndicatorPosition);
      clearTimeout(timer);
    };
  }, [activeTab, language]);

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

          {/* Right Section: Cloud Status, Notifications Toggle, Theme Toggle & [P] Avatar */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            
            {/* Live Cloud Status Pill with Instant Manual Sync Trigger */}
            <button 
              onClick={onManualSync}
              type="button"
              disabled={isCloudSyncing}
              aria-label="Synchronize with Cloud"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-card border border-slate-200/80 dark:border-white/10 text-[11px] font-bold select-none cursor-pointer hover:border-sky-500/50 hover:bg-sky-500/10 transition-all active:scale-95 group"
              title={
                isLiveApi 
                  ? `Live Connected to TiDB Cloud MySQL${lastSyncedAt ? ` • Last synced at ${lastSyncedAt}` : ''}. Click to refresh from cloud.` 
                  : 'Operating in LocalStorage Mode. Click to reconnect to Cloud.'
              }
            >
              <span className={`w-2 h-2 rounded-full ${isLiveApi ? (isCloudSyncing ? 'bg-sky-400 animate-ping' : 'bg-emerald-500 animate-pulse') : 'bg-amber-400'}`} />
              <span className={`hidden sm:inline transition-colors ${isLiveApi ? 'text-slate-700 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-cyan-300' : 'text-amber-600 dark:text-amber-400'}`}>
                {isCloudSyncing ? t('cloud_syncing', 'Syncing...') : (isLiveApi ? t('cloud_live', 'Cloud Live') : t('cloud_reconnect', 'Sync Cloud'))}
              </span>
              <RefreshCw className={`w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:text-sky-500 transition-transform ${isCloudSyncing ? 'animate-spin text-sky-500' : ''}`} />
            </button>

            {/* Notification Center (Bell Toggle + Settings) */}
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              preferences={notificationPrefs}
              onUpdatePreferences={onUpdateNotificationPrefs}
              onMarkAllRead={onMarkAllRead}
              onClearAll={onClearAllNotifications}
              onDismissNotification={onDismissNotification}
              onActionClick={onNotificationAction}
              isLiveApi={isLiveApi}
              isCloudSyncing={isCloudSyncing}
            />

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle Theme"
              className="w-8 h-8 rounded-xl glass-card flex items-center justify-center text-slate-700 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-slate-200/80 dark:border-white/10 shadow-sm"
              title={`Switch to ${theme === 'dark' ? t('theme_light', 'Light') : t('theme_dark', 'Dark')} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-sky-600" />
              )}
            </button>

            {/* Property Admin Interactive [P] Logo with Multi-Language Toggle Pop-up */}
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

              {/* Pop-Up Menu: Admin Profile + Language Toggle (English & Gujarati) + Sign Out */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-3xl glass-modal p-3 border border-slate-200/80 dark:border-white/15 shadow-2xl z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 ease-out origin-top-right">
                  
                  {/* Admin Info Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        P
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {t('admin_profile', 'Admin Profile')}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {t('property_manager', 'Property Manager')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Language Toggle Control (English & Gujarati) */}
                  <div className="p-2 mb-2 rounded-2xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 px-0.5">
                      <div className="flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-sky-500" />
                        <span>{t('language', 'Language')}</span>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        {language === 'gu' ? 'ગુજરાતી' : 'English'}
                      </span>
                    </div>

                    {/* 2-Option Segmented Pill: English & Gujarati */}
                    <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl bg-slate-200/80 dark:bg-white/10">
                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 select-none ${
                          language === 'en'
                            ? 'bg-white dark:bg-sky-600 text-sky-700 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>English</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('gu')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 select-none ${
                          language === 'gu'
                            ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm ring-1 ring-sky-400/30'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>ગુજરાતી</span>
                      </button>
                    </div>
                  </div>

                  {/* GitHub Auto-Update Status & Manual Check */}
                  <div className="mb-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Git Auto-Refresh</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        #{gitCommit}
                      </span>
                    </div>
                    {onCheckUpdate && (
                      <button
                        type="button"
                        onClick={() => {
                          onCheckUpdate();
                        }}
                        className="mt-1.5 w-full py-1 px-2 rounded-lg text-[11px] font-semibold text-sky-600 dark:text-cyan-400 hover:bg-sky-500/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Check for Code Updates</span>
                      </button>
                    )}
                  </div>

                  {/* Reset to Clean / Fresh App Option */}
                  {onResetApp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onResetApp();
                      }}
                      className="w-full mb-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/25 border border-amber-500/20 transition-all cursor-pointer shadow-sm select-none"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'gu' ? 'બધો ડેટા સાફ કરો (૦ એન્ટ્રી)' : 'Reset to Fresh App (0 Entries)'}</span>
                    </button>
                  )}

                  {/* Sign Out Option */}
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/25 border border-rose-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('sign_out', 'Sign Out')}</span>
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
