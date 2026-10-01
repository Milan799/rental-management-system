import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Calendar, 
  Check, 
  Info, 
  Users, 
  Clock, 
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { formatINR, getPreviousMonthStr, getMonthDisplayName } from '../utils/whatsapp';
import MonthSelector from './MonthSelector';

export default function UtilitySplitView({
  rooms = [],
  selectedMonth,
  setSelectedMonth,
  setActiveTab,
  onGenerateBills
}) {
  const occupiedRooms = rooms.filter(r => r.is_occupied);
  const occupiedCount = occupiedRooms.length;

  // Month labels for 2-month bi-monthly display
  const currentMonthLabel = getMonthDisplayName(selectedMonth) || selectedMonth;
  const prevMonthStr = getPreviousMonthStr(selectedMonth);
  const prevMonthLabel = getMonthDisplayName(prevMonthStr) || 'Previous Month';

  // Total Building Electricity Bill (Light Bill for 2 months)
  const [electricity, setElectricity] = useState('6000');

  // Due date for payment (defaults to 7 days ahead)
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Room-wise stayed days mapping: { [roomId]: daysStayed }
  const [roomDays, setRoomDays] = useState(() => {
    const initial = {};
    rooms.forEach(r => {
      if (r.is_occupied) {
        initial[r.room_id] = r.current_bill?.days_stayed || 30;
      }
    });
    return initial;
  });

  // Ensure any newly occupied rooms get initialized with 30 days
  useEffect(() => {
    setRoomDays(prev => {
      const updated = { ...prev };
      let changed = false;
      rooms.forEach(r => {
        if (r.is_occupied && updated[r.room_id] === undefined) {
          updated[r.room_id] = r.current_bill?.days_stayed || 30;
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [rooms]);

  const [successMessage, setSuccessMessage] = useState('');

  // Handle Days Change for a Specific Room
  const handleDaysChange = (roomId, newDays) => {
    const parsed = Math.max(0, Math.min(31, parseInt(newDays, 10) || 0));
    setRoomDays(prev => ({
      ...prev,
      [roomId]: parsed
    }));
  };

  // -------------------------------------------------------------
  // UNIFIED 2-MONTH DISTRIBUTION CALCULATION:
  // 1. Total Room-Days across all occupied rooms (30 days cycle per month)
  // 2. Bill is split 50% for Current Month + 50% for Previous Month
  // 3. If Electricity = 0, automatically acts as an off-month (rent only)
  // -------------------------------------------------------------
  const totalRoomDays = occupiedRooms.reduce((sum, r) => {
    const days = Number(roomDays[r.room_id] ?? 30);
    return sum + Math.max(0, days);
  }, 0);

  const numElec = Math.max(0, Number(electricity || 0));
  const halfBill = numElec > 0 ? numElec / 2 : 0;
  const dailyRateHalf = totalRoomDays > 0 ? Number((halfBill / totalRoomDays).toFixed(2)) : 0;
  const dailyRateTotal = dailyRateHalf * 2;

  // Build room-by-room calculated bill preview
  const roomCalculatedBills = occupiedRooms.map(r => {
    const days = Number(roomDays[r.room_id] ?? 30);
    let currentMonthShare = 0;
    let prevMonthShare = 0;

    if (numElec > 0) {
      currentMonthShare = Math.round(days * dailyRateHalf);
      prevMonthShare = Math.round(days * dailyRateHalf);
    }

    const totalElec = currentMonthShare + prevMonthShare;
    const totalMonthBill = Number(r.base_rent) + totalElec;

    return {
      roomId: r.room_id,
      roomNumber: r.room_number,
      floorNumber: r.floor_number,
      tenantName: r.tenant?.full_name || 'Tenant',
      baseRent: Number(r.base_rent),
      daysStayed: days,
      electricityShare: currentMonthShare,
      prevMonthElectricityShare: prevMonthShare,
      totalElectricityShare: totalElec,
      totalCurrentMonth: totalMonthBill
    };
  });

  const totalCalculatedElectricity = roomCalculatedBills.reduce((acc, rb) => acc + rb.totalElectricityShare, 0);

  const handleApplySplit = (e) => {
    e.preventDefault();

    onGenerateBills({
      totalElectricity: numElec,
      dueDate,
      cycleType: numElec > 0 ? 'BIMONTHLY_SPLIT' : 'NO_BILL',
      cycleDays: 30,
      isBiMonthly: numElec > 0,
      prevMonthLabel: prevMonthLabel,
      currentMonthLabel: currentMonthLabel,
      roomBills: roomCalculatedBills.map(rb => ({
        roomId: rb.roomId,
        daysStayed: rb.daysStayed,
        electricityShare: rb.electricityShare,
        prevMonthElectricityShare: rb.prevMonthElectricityShare,
        baseRent: rb.baseRent,
        totalCurrentMonth: rb.totalCurrentMonth
      }))
    });

    const msg = numElec > 0
      ? `Success! 2-month electricity bill (₹${formatINR(numElec)}) split 50-50 (₹${formatINR(halfBill)} for ${currentMonthLabel} + ₹${formatINR(halfBill)} for ${prevMonthLabel}) and applied to all ${occupiedCount} rooms.`
      : `Success! Electricity set to ₹0. Rent-only bills generated for all ${occupiedCount} rooms.`;

    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* Title & Month Selector Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-400/25 flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 fill-amber-500/20" />
            </div>
            Electricity & Utility Split
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Unified 2-month electricity billing: automatically splits 50% for {currentMonthLabel} and 50% for {prevMonthLabel} alongside fixed monthly rent
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
          <div className="glass-card px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs text-sky-700 dark:text-cyan-300 border-slate-200/80 dark:border-white/10">
            <Users className="w-4 h-4" />
            <span>Active Tenants: <strong>{occupiedCount} / 7</strong></span>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {/* KPI Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total 2-Month Light Bill
          </span>
          <span className="text-lg sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
            ₹{formatINR(numElec)}
          </span>
          <span className="text-[10px] text-slate-400">
            {numElec > 0 ? `₹${formatINR(halfBill)} / month (50%)` : 'No bill received this month'}
          </span>
        </div>

        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Coverage Period
          </span>
          <span className="text-lg sm:text-2xl font-extrabold text-sky-600 dark:text-cyan-400 mt-1 block">
            2 Months
          </span>
          <span className="text-[10px] text-slate-400">
            {prevMonthLabel} + {currentMonthLabel}
          </span>
        </div>

        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Daily Rate / Room
          </span>
          <span className="text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
            ₹{dailyRateTotal.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400">
            ₹{dailyRateHalf.toFixed(2)}/day per active month
          </span>
        </div>

        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Room Base Rent
          </span>
          <span className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            100% Fixed
          </span>
          <span className="text-[10px] text-slate-400">Monthly rent is never pro-rated</span>
        </div>

      </div>

      {/* Main Single Form */}
      <form onSubmit={handleApplySplit} className="space-y-4 sm:space-y-6">
        
        {/* Step 1: Total Light Bill Amount & Payment Date */}
        <div className="glass-modal rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-white/15 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/10 pb-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              1. Enter Total Building Electricity Bill
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Billing Months: <strong>{prevMonthLabel} & {currentMonthLabel}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            
            {/* Total 2-Month Electricity Input */}
            <div className="glass-card p-3.5 sm:p-4 rounded-2xl border-slate-200/80 dark:border-white/10">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Total 2-Month Electricity Bill Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={electricity}
                onChange={(e) => setElectricity(e.target.value)}
                className="glass-input w-full px-3.5 py-2 rounded-xl text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400"
                placeholder="Enter 0 if no bill this month"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                {numElec > 0 ? (
                  <span className="text-amber-700 dark:text-amber-300 font-bold">
                    Automatic 50-50 Split: ₹{formatINR(halfBill)} ({currentMonthLabel}) + ₹{formatINR(halfBill)} ({prevMonthLabel})
                  </span>
                ) : (
                  'Enter 0 for off-month — only fixed room rent will be billed'
                )}
              </span>
            </div>

            {/* Due Date for Payment */}
            <div className="glass-card p-3.5 sm:p-4 rounded-2xl border-slate-200/80 dark:border-white/10">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Payment Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Payment deadline shown on tenant invoices
              </span>
            </div>

          </div>
        </div>

        {/* Step 2: Room-by-Room Day-Wise Input & Live Calculation */}
        <div className="glass-modal rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-white/15 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/10 pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                2. Room Rent & Electricity Breakdown
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Room base rent is 100% fixed (1 month). The 2-month electricity bill is automatically distributed across both months based on stayed days.
              </p>
            </div>
            
            {/* Quick Reset Button */}
            {occupiedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  const allFull = {};
                  rooms.forEach(r => {
                    if (r.is_occupied) allFull[r.room_id] = 30;
                  });
                  setRoomDays(allFull);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer border border-slate-200/80 dark:border-white/10"
              >
                Reset All to 30 Days
              </button>
            )}
          </div>

          {occupiedCount === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/15 text-sky-600 dark:bg-cyan-500/20 dark:text-cyan-300 border border-sky-400/30 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Active Tenants Assigned Yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Electricity is calculated for occupied rooms. Please onboard tenants to rooms first in the Rooms & Tenants tab.
                </p>
              </div>
              {setActiveTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab('rooms')}
                  className="glass-button-primary px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Go to Rooms & Tenants</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px]">
                      <th className="py-3 px-3">Room & Tenant</th>
                      <th className="py-3 px-3 text-right">Fixed Monthly Rent</th>
                      <th className="py-3 px-3 text-center">Days Stayed</th>
                      <th className="py-3 px-3 text-right">2-Month Light Bill (50-50)</th>
                      <th className="py-3 px-3 text-right">Total Current Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                    {roomCalculatedBills.map(rb => {
                      return (
                        <tr key={rb.roomId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          
                          {/* Room & Tenant */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-700 dark:text-cyan-300 flex items-center justify-center font-bold text-xs">
                                {rb.roomNumber}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white block">
                                  Room {rb.roomNumber}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {rb.tenantName} • Floor {rb.floorNumber}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Fixed Rent */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              ₹{formatINR(rb.baseRent)}
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                              Fixed Rent
                            </span>
                          </td>

                          {/* Days Stayed Input */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDaysChange(rb.roomId, (rb.daysStayed || 0) - 1)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                -
                              </button>
                              
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="31"
                                  value={rb.daysStayed}
                                  onChange={(e) => handleDaysChange(rb.roomId, e.target.value)}
                                  className="glass-input w-16 px-2 py-1 rounded-lg text-center font-extrabold text-sm text-sky-700 dark:text-cyan-300"
                                />
                                <span className="text-[10px] text-slate-400 block text-center mt-0.5">Days</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDaysChange(rb.roomId, (rb.daysStayed || 0) + 1)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                +
                              </button>

                              {/* Quick presets */}
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  type="button"
                                  onClick={() => handleDaysChange(rb.roomId, 20)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                                    rb.daysStayed === 20 ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                  }`}
                                >
                                  20d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDaysChange(rb.roomId, 15)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                                    rb.daysStayed === 15 ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                  }`}
                                >
                                  15d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDaysChange(rb.roomId, 30)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                                    rb.daysStayed === 30 ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                  }`}
                                >
                                  Full (30d)
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* 2-Month Light Bill Share */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                              ₹{formatINR(rb.totalElectricityShare)}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                              {numElec > 0 ? (
                                `₹${formatINR(rb.electricityShare)} (${currentMonthLabel}) + ₹${formatINR(rb.prevMonthElectricityShare)} (${prevMonthLabel})`
                              ) : (
                                '₹0 (No Bill)'
                              )}
                            </span>
                          </td>

                          {/* Total Month Bill */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="font-extrabold text-slate-900 dark:text-white text-base">
                              ₹{formatINR(rb.totalCurrentMonth)}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              ₹{formatINR(rb.baseRent)} + ₹{formatINR(rb.totalElectricityShare)}
                            </span>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card-Based Day-Wise List */}
              <div className="block md:hidden space-y-3">
                {roomCalculatedBills.map(rb => {
                  return (
                    <div 
                      key={rb.roomId}
                      className="glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-700 dark:text-cyan-300 flex items-center justify-center font-extrabold text-xs">
                            {rb.roomNumber}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              Room {rb.roomNumber}
                            </h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {rb.tenantName}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            ₹{formatINR(rb.baseRent)}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                            Fixed Rent
                          </span>
                        </div>
                      </div>

                      {/* Days Stayed Stepper Control */}
                      <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                            Stayed Days
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Rate: ₹{dailyRateTotal.toFixed(2)}/day (2-mo)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDaysChange(rb.roomId, (rb.daysStayed || 0) - 1)}
                            className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-slate-800 dark:text-white cursor-pointer active:scale-95"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="31"
                            value={rb.daysStayed}
                            onChange={(e) => handleDaysChange(rb.roomId, e.target.value)}
                            className="glass-input w-14 py-1 text-center font-extrabold text-sm rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleDaysChange(rb.roomId, (rb.daysStayed || 0) + 1)}
                            className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-slate-800 dark:text-white cursor-pointer active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Calculated Electricity & Total */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-xs">
                        <div>
                          <span className="text-[10px] text-amber-800 dark:text-amber-200 font-semibold uppercase block">
                            2-Month Light Bill (50-50)
                          </span>
                          <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300">
                            ₹{formatINR(rb.totalElectricityShare)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">
                            Total Room Payable
                          </span>
                          <span className="text-base font-extrabold text-slate-900 dark:text-white">
                            ₹{formatINR(rb.totalCurrentMonth)}
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Transparent Logic Explanation Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
            <Info className="w-5 h-5 text-sky-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-slate-900 dark:text-white block font-bold">
                Transparent Calculation Formula:
              </strong>
              {numElec > 0 ? (
                <span>
                  Total 2-month electricity bill (<strong>₹{formatINR(numElec)}</strong>) is automatically split into 2 equal halves: <strong>₹{formatINR(halfBill)} ({currentMonthLabel})</strong> + <strong>₹{formatINR(halfBill)} ({prevMonthLabel})</strong>. Room base rent remains fixed. If a tenant stayed fewer days, their electricity share is calculated day-wise.
                </span>
              ) : (
                <span>
                  Electricity bill is set to ₹0. Only the fixed 1-month room rent will be billed for all rooms.
                </span>
              )}
            </div>
          </div>

          {/* Single Action Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={occupiedCount === 0}
              className={`w-full py-3.5 sm:py-4 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition-all ${
                occupiedCount === 0
                  ? 'bg-slate-300 dark:bg-white/10 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60'
                  : 'glass-button-primary cursor-pointer shadow-lg hover:scale-[1.01]'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {numElec > 0 
                  ? `Save & Apply 2-Month Electricity Bills to All ${occupiedCount} Rooms` 
                  : `Save & Apply Rent-Only Bills to All ${occupiedCount} Rooms`}
              </span>
            </button>
          </div>

        </div>

      </form>

    </div>
  );
}
