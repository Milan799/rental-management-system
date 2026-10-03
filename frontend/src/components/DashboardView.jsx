import React, { useState } from 'react';
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
  Layers,
  MessageSquare,
  CreditCard,
  UserPlus,
  Phone,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Check,
  Home,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  formatINR, 
  getTimeframeInfo, 
  calculateRoomPeriodFigures,
  buildWhatsAppReminderUrl 
} from '../utils/whatsapp';
import TimeframeFilter from './TimeframeFilter';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardView({
  rooms = [],
  selectedMonth,
  setSelectedMonth,
  setActiveTab,
  timeframe = 'CURRENT_MONTH',
  setTimeframe,
  onOpenPayment,
  onOpenTenantEntry
}) {
  const { t, language } = useLanguage();
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);

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

  // Floor-specific financials
  let floor1Expected = 0;
  let floor1Collected = 0;
  let floor1Pending = 0;

  let floor2Expected = 0;
  let floor2Collected = 0;
  let floor2Pending = 0;

  const roomItems = occupiedRooms.map(r => {
    const figs = calculateRoomPeriodFigures(r, timeframe);
    expectedRevenue += figs.totalPayable;
    totalCollected += figs.amountPaid;
    totalPending += figs.balanceDue;
    fixedRentTotal += figs.fixedRent;
    utilityTotal += figs.electricity;

    if (r.floor_number === 1) {
      floor1Expected += figs.totalPayable;
      floor1Collected += figs.amountPaid;
      floor1Pending += figs.balanceDue;
    } else {
      floor2Expected += figs.totalPayable;
      floor2Collected += figs.amountPaid;
      floor2Pending += figs.balanceDue;
    }

    return {
      room: r,
      figures: figs
    };
  });

  const collectionRate = expectedRevenue > 0 ? Math.round((totalCollected / expectedRevenue) * 100) : 0;
  const floor1Rate = floor1Expected > 0 ? Math.round((floor1Collected / floor1Expected) * 100) : 0;
  const floor2Rate = floor2Expected > 0 ? Math.round((floor2Collected / floor2Expected) * 100) : 0;

  // Filtered rooms for Watchlist
  const displayedRoomItems = filterPendingOnly
    ? roomItems.filter(item => item.figures.balanceDue > 0)
    : roomItems;

  const pendingDuesCount = roomItems.filter(item => item.figures.balanceDue > 0).length;

  // WhatsApp Reminder Sender
  const handleSendWhatsAppReminder = (room, figs) => {
    if (!room.tenant) return;
    const b = room.current_bill;
    const url = buildWhatsAppReminderUrl({
      tenantName: room.tenant.full_name || room.tenant.name,
      roomNumber: room.room_number,
      phone: room.tenant.whatsapp_number || room.tenant.phone_number,
      billingMonth: selectedMonth,
      baseRent: figs.fixedRent,
      electricityShare: figs.electricity,
      prevMonthElectricityShare: 0,
      daysStayed: b?.days_stayed || 30,
      cycleType: b?.cycle_type,
      cycleDays: b?.cycle_days,
      isBiMonthly: b?.is_bimonthly,
      prevMonthLabel: b?.prev_month_label,
      currentMonthLabel: b?.current_month_label,
      waterShare: 0,
      maintenanceShare: 0,
      carriedForwardDues: b?.carried_forward_dues || 0,
      amountPaid: figs.amountPaid,
      dueDate: b?.due_date || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
    });
    window.open(url, '_blank');
  };

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

      {/* REPLACED QUICK ACTIONS: DUAL ACTION SECTIONS */}
      {/* 1. LIVE RENT COLLECTION WATCHLIST & 2. FLOOR-WISE PERFORMANCE MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* LEFT / MAIN (7 COLS): LIVE RENT COLLECTION WATCHLIST */}
        <div className="lg:col-span-7 glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            {/* Watchlist Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-400/30 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Rent Collection & Dues Watchlist</span>
                    {pendingDuesCount > 0 ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                        {pendingDuesCount} Pending
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        100% Settled
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {pendingDuesCount > 0 
                      ? `${pendingDuesCount} of ${occupiedCount} active tenants have outstanding balance for ${tfInfo.shortPeriodLabel}`
                      : `All ${occupiedCount} active rooms are fully clear for ${tfInfo.shortPeriodLabel}!`}
                  </p>
                </div>
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold self-stretch sm:self-auto justify-center">
                <button
                  type="button"
                  onClick={() => setFilterPendingOnly(false)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    !filterPendingOnly 
                      ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-cyan-300 shadow-xs font-bold' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Active ({occupiedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPendingOnly(true)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterPendingOnly 
                      ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs font-bold' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Pending Only ({pendingDuesCount})
                </button>
              </div>
            </div>

            {/* Watchlist Body / Tenant Cards */}
            <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {displayedRoomItems.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">All Dues Settled!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    {filterPendingOnly 
                      ? 'No tenants have pending balances for this timeframe. Everything is fully collected!'
                      : 'No occupied rooms found. Onboard tenants from the Rooms tab.'}
                  </p>
                </div>
              ) : (
                displayedRoomItems.map(({ room, figures }) => {
                  const isPaid = figures.balanceDue <= 0;
                  const isPartial = figures.amountPaid > 0 && !isPaid;

                  return (
                    <div 
                      key={room.room_id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 hover:border-sky-400/40 dark:hover:border-cyan-400/30 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                    >
                      {/* Left: Room Badge & Tenant */}
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">RM</span>
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">{room.room_number}</span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {room.tenant?.full_name || room.tenant?.name || `Tenant ${room.room_number}`}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium">
                              (F{room.floor_number})
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {room.tenant?.phone_number || room.tenant?.phone || 'No phone'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Balance & Action Buttons */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
                        
                        {/* Amount & Status Badge */}
                        <div className="text-left sm:text-right">
                          <div className="flex items-baseline sm:justify-end gap-1">
                            <span className={`text-xs sm:text-sm font-extrabold ${isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isPaid ? '₹0 Due' : `₹${formatINR(figures.balanceDue)}`}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {isPaid 
                              ? `Total: ₹${formatINR(figures.totalPayable)}` 
                              : `Paid: ₹${formatINR(figures.amountPaid)} / ₹${formatINR(figures.totalPayable)}`}
                          </p>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* 1-Click WhatsApp Reminder Button */}
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppReminder(room, figures)}
                            title="Send WhatsApp payment reminder invoice"
                            className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* 1-Click Collect / Record Payment Button */}
                          {onOpenPayment && (
                            <button
                              type="button"
                              onClick={() => onOpenPayment(room)}
                              title="Record payment for this room"
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                                isPaid
                                  ? 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                  : 'glass-button-primary text-white'
                              }`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{isPaid ? 'Add Pay' : 'Collect'}</span>
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Watchlist Footer Summary */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Total Dues in Scope: <strong className="text-slate-900 dark:text-white font-bold">₹{formatINR(totalPending)}</strong>
            </span>
            <button
              onClick={() => setActiveTab('ledger')}
              className="text-sky-600 dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Ledger & History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT (5 COLS): FLOOR 1 vs FLOOR 2 OCCUPANCY & FINANCIAL MATRIX */}
        <div className="lg:col-span-5 glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            {/* Matrix Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Floor 1 vs Floor 2 Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live revenue & room occupancy comparison
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-700 dark:text-cyan-300 border border-sky-400/20">
                {occupiedCount}/7 Active
              </span>
            </div>

            {/* Matrix Content: Floor 1 Box */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Floor 1 (4 Rooms: 101 - 104)
                  </span>
                </div>
                <span className="text-xs font-bold text-sky-700 dark:text-cyan-400">
                  {floor1Occupied} / 4 Occupied ({Math.round((floor1Occupied / 4) * 100)}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-sky-500 to-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((floor1Occupied / 4) * 100)}%` }}
                ></div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block">Expected</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">₹{formatINR(floor1Expected)}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block">Collected</span>
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">₹{formatINR(floor1Collected)}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block">Pending</span>
                  <span className={`text-xs font-extrabold ${floor1Pending > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>₹{formatINR(floor1Pending)}</span>
                </div>
              </div>

              {/* Room Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                {floor1Rooms.map(r => (
                  <div 
                    key={r.room_id}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      r.is_occupied 
                        ? 'bg-sky-50/50 dark:bg-cyan-500/5 border-sky-400/30 text-sky-800 dark:text-cyan-200' 
                        : 'bg-slate-100/50 dark:bg-white/5 border-dashed border-slate-300 dark:border-white/20 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold block">Room {r.room_number}</span>
                    <span className="text-[11px] font-extrabold truncate block">
                      {r.is_occupied ? (r.tenant?.full_name?.split(' ')[0] || 'Occupied') : 'Vacant'}
                    </span>
                    <span className="text-[9px] opacity-75 block">₹{formatINR(r.base_rent)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Matrix Content: Floor 2 Box */}
            <div className="mt-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Floor 2 (3 Rooms: 201 - 203)
                  </span>
                </div>
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  {floor2Occupied} / 3 Occupied ({Math.round((floor2Occupied / 3) * 100)}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((floor2Occupied / 3) * 100)}%` }}
                ></div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block">Expected</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">₹{formatINR(floor2Expected)}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block">Collected</span>
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">₹{formatINR(floor2Collected)}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block">Pending</span>
                  <span className={`text-xs font-extrabold ${floor2Pending > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>₹{formatINR(floor2Pending)}</span>
                </div>
              </div>

              {/* Room Pills */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {floor2Rooms.map(r => (
                  <div 
                    key={r.room_id}
                    onClick={() => {
                      if (!r.is_occupied && onOpenTenantEntry) {
                        onOpenTenantEntry(r);
                      }
                    }}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      r.is_occupied 
                        ? 'bg-cyan-50/50 dark:bg-cyan-500/5 border-cyan-400/30 text-cyan-800 dark:text-cyan-200' 
                        : 'bg-amber-50/50 dark:bg-amber-500/5 border-dashed border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 hover:scale-105 cursor-pointer'
                    }`}
                  >
                    <span className="text-[10px] font-bold block">Room {r.room_number}</span>
                    <span className="text-[11px] font-extrabold truncate block">
                      {r.is_occupied ? (r.tenant?.full_name?.split(' ')[0] || 'Occupied') : '+ Onboard'}
                    </span>
                    <span className="text-[9px] opacity-75 block">₹{formatINR(r.base_rent)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Matrix Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Total Building Capacity: <strong className="text-slate-900 dark:text-white font-bold">7 Rooms</strong>
            </span>
            <button
              onClick={() => setActiveTab('rooms')}
              className="text-sky-600 dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage All Rooms</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
