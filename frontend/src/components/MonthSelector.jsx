import React from 'react';
import { Calendar } from 'lucide-react';

export default function MonthSelector({ selectedMonth, setSelectedMonth, className = '' }) {
  if (!setSelectedMonth) return null;

  return (
    <div className={`inline-flex items-center space-x-2 glass-card px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm ${className}`}>
      <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Period:</span>
      <input
        type="month"
        value={selectedMonth || '2026-10'}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="bg-transparent text-xs font-bold text-sky-700 dark:text-sky-300 focus:outline-none cursor-pointer"
        title="Select Billing Month"
      />
    </div>
  );
}
