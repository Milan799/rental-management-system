import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  CheckCheck, 
  SlidersHorizontal, 
  X, 
  AlertTriangle, 
  IndianRupee, 
  Cloud, 
  Zap, 
  Info, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  ChevronRight,
  Trash2
} from 'lucide-react';

export default function NotificationCenter({
  notifications = [],
  unreadCount = 0,
  preferences = { enabled: true, sound: true, duesAlerts: true, cloudAlerts: true },
  onUpdatePreferences,
  onMarkAllRead,
  onClearAll,
  onDismissNotification,
  onActionClick,
  isLiveApi = false,
  isCloudSyncing = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'dues' | 'activity'
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setShowSettings(false);
  };

  const handleTogglePref = (key) => {
    if (onUpdatePreferences) {
      onUpdatePreferences({
        ...preferences,
        [key]: !preferences[key]
      });
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter(item => {
    if (activeFilter === 'dues') return item.type === 'due' || item.type === 'alert';
    if (activeFilter === 'activity') return item.type !== 'due' && item.type !== 'alert';
    return true;
  });

  const dueCount = notifications.filter(n => n.type === 'due' || n.type === 'alert').length;

  const getIcon = (type) => {
    switch (type) {
      case 'due':
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'payment':
        return <IndianRupee className="w-4 h-4 text-emerald-400" />;
      case 'cloud':
        return <Cloud className="w-4 h-4 text-sky-400" />;
      case 'utility':
        return <Zap className="w-4 h-4 text-indigo-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* 1. BELL TOGGLE BUTTON */}
      <button
        onClick={toggleOpen}
        type="button"
        aria-label="Toggle Notifications"
        title="Notifications & Alerts"
        className={`relative w-8 h-8 rounded-xl glass-card flex items-center justify-center transition-all cursor-pointer border ${
          isOpen
            ? 'bg-sky-500/20 text-sky-500 border-sky-400/40 ring-2 ring-sky-400/30 scale-105'
            : 'text-slate-700 dark:text-slate-300 hover:scale-105 active:scale-95 border-slate-200/80 dark:border-white/10 shadow-sm'
        }`}
      >
        {preferences.enabled ? (
          unreadCount > 0 ? (
            <BellRing className="w-4 h-4 text-amber-500 animate-pulse" />
          ) : (
            <Bell className="w-4 h-4" />
          )
        ) : (
          <BellOff className="w-4 h-4 text-slate-400" />
        )}

        {/* Unread Badge Pill */}
        {unreadCount > 0 && preferences.enabled && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 2. GLASSMORPHIC NOTIFICATION POPOVER */}
      {isOpen && (
        <div className="absolute right-0 sm:right-[-40px] md:right-0 top-full mt-2 w-[92vw] sm:w-[380px] max-w-sm rounded-3xl glass-modal p-4 border border-slate-200/80 dark:border-white/15 shadow-2xl z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ease-out origin-top-right">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Toggle Settings Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                type="button"
                title="Toggle Notification Settings"
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  showSettings 
                    ? 'bg-sky-500/20 text-sky-500' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  type="button"
                  title="Mark all as read"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TOGGLE SETTINGS PANEL (EXPANDABLE) */}
          {showSettings && (
            <div className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Notification Controls</span>
                <span className="text-[10px] text-sky-500 font-semibold">Saved locally</span>
              </div>

              {/* Master Switch: Notifications Active */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-sky-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Enable In-App Alerts
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('enabled')}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                    preferences.enabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                      preferences.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sub-Switch: Sound Chime */}
              <div className="flex items-center justify-between py-1 pl-5 border-t border-slate-200/50 dark:border-white/5">
                <div className="flex items-center gap-2">
                  {preferences.sound ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    Audio Chimes
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!preferences.enabled}
                  onClick={() => handleTogglePref('sound')}
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                    !preferences.enabled ? 'opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700' : preferences.sound ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                      preferences.sound ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sub-Switch: Rent Due Alerts */}
              <div className="flex items-center justify-between py-1 pl-5 border-t border-slate-200/50 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    Rent Due Reminders
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!preferences.enabled}
                  onClick={() => handleTogglePref('duesAlerts')}
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                    !preferences.enabled ? 'opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700' : preferences.duesAlerts ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                      preferences.duesAlerts ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sub-Switch: TiDB Cloud Sync Alerts */}
              <div className="flex items-center justify-between py-1 pl-5 border-t border-slate-200/50 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Cloud className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    TiDB Cloud Sync Alerts
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!preferences.enabled}
                  onClick={() => handleTogglePref('cloudAlerts')}
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                    !preferences.enabled ? 'opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700' : preferences.cloudAlerts ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                      preferences.cloudAlerts ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 my-2.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 text-[11px] font-bold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('dues')}
              className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'dues'
                  ? 'bg-white dark:bg-white/15 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dues ({dueCount})
            </button>
            <button
              onClick={() => setActiveFilter('activity')}
              className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'activity'
                  ? 'bg-white dark:bg-white/15 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Activity
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 select-none">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  All caught up!
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  No active alerts for this category.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl p-2.5 transition-all border ${
                    item.read
                      ? 'bg-transparent border-slate-200/50 dark:border-white/5 opacity-70'
                      : 'bg-slate-50/80 dark:bg-white/5 border-slate-200/90 dark:border-white/10 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Icon */}
                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        {!item.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                        {item.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/40 dark:border-white/5">
                        <span className="text-[9px] text-slate-400 font-medium">
                          {item.timestamp || 'Just now'}
                        </span>

                        {/* Optional action button */}
                        {item.action && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              if (onActionClick) onActionClick(item);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            <span>{item.action.label || 'View'}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={() => onDismissNotification(item.id)}
                      title="Dismiss"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-[11px]">
            {/* Live Cloud Status */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className={`w-2 h-2 rounded-full ${isLiveApi ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-[10px]">
                {isLiveApi ? (isCloudSyncing ? 'TiDB Syncing...' : 'TiDB Cloud Live') : 'Local Mode'}
              </span>
            </div>

            {/* Clear All */}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
