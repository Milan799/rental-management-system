import React from 'react';
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Calculator,
  LayoutDashboard,
  Building2,
  IndianRupee,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import { formatINR, getTimeframeInfo, calculateRoomPeriodFigures } from '../utils/whatsapp';
import TimeframeFilter from './TimeframeFilter';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardView({
  rooms = [],
  selectedMonth,
  setSelectedMonth,
  setActiveTab,
  timeframe = 'CURRENT_MONTH',
  setTimeframe
}) {
  const { t, language } = useLanguage();
  const totalRooms = rooms.length || 7;
  const occupiedRooms = rooms.filter(r => r.is_occupied);
  const occupiedCount = occupiedRooms.length;
  const vacantCount = totalRooms - occupiedCount;
  const occupancyPercent = Math.round((occupiedCount / totalRooms) * 100);

  // Active Timeframe Meta
  const tfInfo = getTimeframeInfo(timeframe, selectedMonth);

  // Floor stats
  const floor1Rooms = rooms.filter(r => r.floor_number === 1);
  const floor1Occupied = floor1Rooms.filter(r => r.is_occupied).length;
  const floor2Rooms = rooms.filter(r => r.floor_number === 2);
  const floor2Occupied = floor2Rooms.filter(r => r.is_occupied).length;

  // Financial calculations live based on selected timeframe
  let expectedRevenue = 0;
  let totalCollected = 0;
  let totalPending = 0;
  let fixedRentTotal = 0;
  let utilityTotal = 0;

  rooms.forEach(r => {
    if (r.is_occupied) {
      const figs = calculateRoomPeriodFigures(r, timeframe);
      expectedRevenue += figs.totalPayable;
      totalCollected += figs.amountPaid;
      totalPending += figs.balanceDue;
      fixedRentTotal += figs.fixedRent;
      utilityTotal += figs.electricity;
    }
  });

  const collectionRate = expectedRevenue > 0 ? Math.round((totalCollected / expectedRevenue) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* Page Title & Timeframe Selector Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:bg-cyan-500/15 dark:text-cyan-400 border border-sky-400/25 flex items-center justify-center shadow-xs">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            {t('property_dashboard', 'Property Dashboard')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('dashboard_subtitle', 'Overview of occupancy, collections & revenue tracking')}
          </p>
        </div>

        {/* 4 Timeframe Filter Buttons */}
        <TimeframeFilter
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />
      </div>

      {/* 4 SUMMARY TABS / KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Occupancy */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 hover:border-sky-400/50 dark:hover:border-cyan-400/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('occupancy', 'Occupancy')}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-sky-500/10 dark:bg-cyan-500/10 border border-sky-500/20 dark:border-cyan-400/20 flex items-center justify-center text-sky-600 dark:text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          
          <div className="mt-3 flex items-baseline space-x-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {occupiedCount} <span className="text-base sm:text-lg font-medium text-slate-500 dark:text-slate-400">/ {totalRooms}</span>
            </h3>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {occupancyPercent}%
            </span>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{t('floor_1', 'Floor 1')}: <strong className="text-slate-900 dark:text-white font-semibold">{floor1Occupied}/4</strong></span>
            <span>{t('floor_2', 'Floor 2')}: <strong className="text-slate-900 dark:text-white font-semibold">{floor2Occupied}/3</strong></span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">{vacantCount} {t('vacant', 'Vacant')}</span>
          </div>

          <div className="mt-3 w-full bg-slate-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-sky-500 to-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${occupancyPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Expected Revenue */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 hover:border-blue-400/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('expected_revenue', 'Expected Revenue')} {tfInfo.count > 1 ? `(${tfInfo.shortLabel})` : ''}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">₹{formatINR(expectedRevenue)}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t('rent', 'Rent')} (₹{formatINR(fixedRentTotal)}) + {t('electricity', 'Electricity')} (₹{formatINR(utilityTotal)})
            </p>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{t('billing_target', 'Billing Target')} ({tfInfo.count} Mo)</span>
            <span className="text-sky-700 dark:text-blue-300 font-semibold">{occupiedCount} {t('accounts', 'Accounts')}</span>
          </div>

          <div className="mt-3 w-full bg-slate-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full w-full"></div>
          </div>
        </div>

        {/* Card 3: Total Collected */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 hover:border-emerald-400/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('total_collected', 'Total Collected')}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight">₹{formatINR(totalCollected)}</h3>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              ({collectionRate}%)
            </span>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{t('collection_rate', 'Collection Rate')}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{collectionRate}% Received</span>
          </div>

          <div className="mt-3 w-full bg-slate-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${collectionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Total Pending Dues */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 hover:border-rose-400/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('pending_dues', 'Pending Dues')}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-rose-500/10 border border-rose-400/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${totalPending > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              ₹{formatINR(totalPending)}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {totalPending > 0 ? `${100 - collectionRate}% balance uncollected` : 'All clear! Zero pending dues'}
            </p>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{totalPending > 0 ? 'Requires Action' : 'Healthy Status'}</span>
            <span className={totalPending > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400 font-semibold'}>
              {totalPending > 0 ? 'Unpaid Balance' : '100% Settled'}
            </span>
          </div>

          <div className="mt-3 w-full bg-slate-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, 100 - collectionRate))}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS BANNER */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
            <span>⚡ {t('quick_actions', 'Quick Actions')}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Direct shortcuts to manage rooms, record collections & utility expenses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('rooms')}
            className="flex-1 md:flex-none glass-button-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('rooms_and_tenants', 'Rooms & Tenants')}</span>
          </button>

          <button
            onClick={() => setActiveTab('utilities')}
            className="flex-1 md:flex-none glass-button-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{t('split_bills', 'Split Utility Bills')}</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className="flex-1 md:flex-none glass-button-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{t('view_ledger', 'View Ledger & Dues')}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
