import React from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { TIMEFRAME_OPTIONS, getTimeframeInfo, getMonthDisplayName } from '../utils/whatsapp';

export default function TimeframeFilter({
  timeframe = 'CURRENT_MONTH',
  setTimeframe,
  selectedMonth = '2026-10',
  setSelectedMonth,
  showMonthPicker = true,
  className = ''
}) {
  const info = getTimeframeInfo(timeframe, selectedMonth);

  return (
    <div className={`space-y-2 w-full lg:w-auto ${className}`}>
      {/* 4-Tab Segmented Switcher (Single Line on Mobile & Desktop) */}
      <div className="grid grid-cols-4 sm:flex sm:items-center p-1 glass-card rounded-2xl border border-slate-200/80 dark:border-white/10 gap-1 shadow-xs w-full sm:w-auto">
        {TIMEFRAME_OPTIONS.map((opt) => {
          const isActive = timeframe === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTimeframe(opt.id)}
              type="button"
              className={`py-2 px-1 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer text-center active:scale-95 flex items-center justify-center ${
                isActive
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
              }`}
            >
              {/* Responsive Text: Concise on mobile, full label on desktop */}
              <span className="sm:hidden truncate">{opt.mobileLabel || opt.shortLabel}</span>
              <span className="hidden sm:inline whitespace-nowrap">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scope Subtitle & Month Selector Pill */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        {/* Left: Active Date Range Sub-Badge */}
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-cyan-400 shrink-0" />
          <span className="truncate text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200">
            {info.periodLabel}
          </span>
          {info.count > 1 && (
            <span className="hidden sm:inline text-[10px] text-slate-400 font-normal">
              ({info.count}m scope)
            </span>
          )}
        </div>

        {/* Right: Sleek Month Picker Pill with transparent native input overlay */}
        {showMonthPicker && setSelectedMonth && (
          <label 
            className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 cursor-pointer shrink-0 transition-colors shadow-2xs"
            title="Click to Change Billing Month"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0" />
            <span className="text-[11px] font-bold text-sky-700 dark:text-cyan-300">
              {getMonthDisplayName(selectedMonth)}
            </span>
            <span className="text-[10px] text-slate-400">▾</span>
            <input
              type="month"
              value={selectedMonth || '2026-10'}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        )}
      </div>
    </div>
  );
}
