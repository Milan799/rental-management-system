import React from 'react';
import { Calendar, Filter, Sparkles } from 'lucide-react';
import { TIMEFRAME_OPTIONS, getTimeframeInfo } from '../utils/whatsapp';

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
    <div className={`space-y-2 ${className}`}>
      {/* 4 Timeframe Buttons & Month Picker Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        
        {/* The 4 Preset Buttons (Current Month, Last 3 Months, Last 6 Months, Last Year) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center p-1 glass-card rounded-2xl border border-slate-200/80 dark:border-white/10 gap-1 shadow-xs">
          {TIMEFRAME_OPTIONS.map((opt) => {
            const isActive = timeframe === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTimeframe(opt.id)}
                type="button"
                className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-center whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Base Month Selector (When Current Month is picked or landlord wants to change base period) */}
        {showMonthPicker && setSelectedMonth && (
          <div className="inline-flex items-center justify-between sm:justify-start space-x-2 glass-card px-3 py-2 sm:py-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Base:</span>
            </div>
            <input
              type="month"
              value={selectedMonth || '2026-10'}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-sky-700 dark:text-cyan-300 focus:outline-none cursor-pointer"
              title="Change Base Billing Month"
            />
          </div>
        )}

      </div>

      {/* Active Range Sub-Badge */}
      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-cyan-300 border border-sky-500/20 font-semibold">
          <Sparkles className="w-3 h-3 text-sky-500 dark:text-cyan-400" />
          {info.periodLabel}
        </span>
        {info.count > 1 && (
          <span className="text-[10px] text-slate-500 font-medium">
            (Aggregated across {info.count} months)
          </span>
        )}
      </div>
    </div>
  );
}
