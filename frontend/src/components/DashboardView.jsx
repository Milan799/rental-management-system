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
  IndianRupee
} from 'lucide-react';
import { formatINR, getTimeframeInfo, calculateRoomPeriodFigures } from '../utils/whatsapp';
import TimeframeFilter from './TimeframeFilter';

export default function DashboardView({
  rooms = [],
  selectedMonth,
  setSelectedMonth,
  setActiveTab,
  timeframe = 'CURRENT_MONTH',
  setTimeframe
}) {
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
            Property Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of occupancy, collections & revenue tracking
          </p>
        </div>

        {/* 4 Timeframe Filter Buttons (Current Month, Last 3 Months, Last 6 Months, Last Year) */}
        <TimeframeFilter
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />
      </div>

      {/* ======================================================== */}
      {/* 4 SUMMARY TABS / KPI CARDS                               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Occupancy */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 hover:border-sky-400/50 dark:hover:border-cyan-400/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Occupancy</span>
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
            <span>Floor 1: <strong className="text-slate-900 dark:text-white font-semibold">{floor1Occupied}/4</strong></span>
            <span>Floor 2: <strong className="text-slate-900 dark:text-white font-semibold">{floor2Occupied}/3</strong></span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">{vacantCount} Vacant</span>
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
              Expected Revenue {tfInfo.count > 1 ? `(${tfInfo.shortLabel})` : ''}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">₹{formatINR(expectedRevenue)}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Rent (₹{formatINR(fixedRentTotal)}) + Electricity (₹{formatINR(utilityTotal)})</p>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Billing Target ({tfInfo.count} Mo)</span>
            <span className="text-sky-700 dark:text-blue-300 font-semibold">{occupiedCount} Accounts</span>
          </div>
        </div>

        {/* Card 3: Total Collected */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 hover:border-emerald-400/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Collected {tfInfo.count > 1 ? `(${tfInfo.shortLabel})` : ''}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">₹{formatINR(totalCollected)}</h3>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {collectionRate}%
            </span>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Reconciled UPI/Cash</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified</span>
          </div>

          <div className="mt-3 w-full bg-slate-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${collectionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Total Pending Dues */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 hover:border-rose-400/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Dues {tfInfo.count > 1 ? `(${tfInfo.shortLabel})` : ''}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-rose-500/10 border border-rose-400/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">₹{formatINR(totalPending)}</h3>
            {totalPending > 0 && (
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                Action Needed
              </span>
            )}
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Pending Recovery</span>
            <button 
              onClick={() => setActiveTab('ledger')}
              className="text-rose-600 dark:text-rose-300 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 2-FLOOR VISUAL SNAPSHOT                                  */}
      {/* ======================================================== */}
      <div className="space-y-4 sm:space-y-6">
        
        {/* Floor 1 Snapshot */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-700 dark:text-cyan-300 flex items-center justify-center font-bold text-xs">
                1F
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">1st Floor (4 Rooms)</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {floor1Occupied} Occupied • {4 - floor1Occupied} Vacant
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {floor1Rooms.map(room => {
              const figs = calculateRoomPeriodFigures(room, timeframe);
              const isDue = room.is_occupied && figs.balanceDue > 0;
              return (
                <div 
                  key={room.room_id}
                  onClick={() => setActiveTab('rooms')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${
                    room.is_occupied
                      ? isDue 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-white/5 border-dashed border-slate-300 dark:border-white/20 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <strong className="text-slate-900 dark:text-white font-bold">Room {room.room_number}</strong>
                    <span className="text-[10px] uppercase font-bold">
                      {room.is_occupied ? (isDue ? 'Due' : 'Paid') : 'Vacant'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 truncate">
                    {room.tenant ? room.tenant.full_name : 'No Tenant'}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
                    ₹{formatINR(figs.fixedRent)}
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      {tfInfo.count === 1 ? '/mo' : ` (${tfInfo.count} Mo)`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floor 2 Snapshot */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                2F
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">2nd Floor (3 Rooms)</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {floor2Occupied} Occupied • {3 - floor2Occupied} Vacant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {floor2Rooms.map(room => {
              const figs = calculateRoomPeriodFigures(room, timeframe);
              const isDue = room.is_occupied && figs.balanceDue > 0;
              return (
                <div 
                  key={room.room_id}
                  onClick={() => setActiveTab('rooms')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${
                    room.is_occupied
                      ? isDue 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-white/5 border-dashed border-slate-300 dark:border-white/20 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <strong className="text-slate-900 dark:text-white font-bold">Room {room.room_number}</strong>
                    <span className="text-[10px] uppercase font-bold">
                      {room.is_occupied ? (isDue ? 'Due' : 'Paid') : 'Vacant'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 truncate">
                    {room.tenant ? room.tenant.full_name : 'No Tenant'}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
                    ₹{formatINR(figs.fixedRent)}
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      {tfInfo.count === 1 ? '/mo' : ` (${tfInfo.count} Mo)`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
