import React, { useState } from 'react';
import { 
  Building2, 
  MessageSquare, 
  CreditCard, 
  UserMinus, 
  UserPlus, 
  Phone, 
  Zap, 
  Receipt,
  CheckCircle2,
  Clock,
  IndianRupee,
  Home,
  Check,
  Edit3,
  User,
  ShieldCheck
} from 'lucide-react';
import { formatINR, buildWhatsAppReminderUrl } from '../utils/whatsapp';

export default function RoomFloorGrid({
  rooms = [],
  onUpdateRent,
  onOpenTenantEntry,
  onOpenEditTenant,
  onOpenLedger,
  onOpenPayment,
  onOpenVacate,
  selectedMonth
}) {
  const [activeFloorFilter, setActiveFloorFilter] = useState('ALL'); // 'ALL' | 1 | 2

  const displayedRooms = activeFloorFilter === 'ALL' 
    ? rooms 
    : rooms.filter(r => r.floor_number === Number(activeFloorFilter));

  const handleWhatsAppClick = (room) => {
    if (!room.tenant || !room.current_bill) return;

    const b = room.current_bill;
    const url = buildWhatsAppReminderUrl({
      tenantName: room.tenant.full_name,
      roomNumber: room.room_number,
      phone: room.tenant.whatsapp_number || room.tenant.phone_number,
      billingMonth: selectedMonth,
      baseRent: b.base_rent,
      electricityShare: b.electricity_share,
      prevMonthElectricityShare: b.prev_month_electricity_share || 0,
      daysStayed: b.days_stayed,
      cycleType: b.cycle_type,
      cycleDays: b.cycle_days,
      isBiMonthly: b.is_bimonthly,
      prevMonthLabel: b.prev_month_label,
      currentMonthLabel: b.current_month_label,
      waterShare: 0,
      maintenanceShare: 0,
      carriedForwardDues: b.carried_forward_dues,
      amountPaid: b.amount_paid,
      dueDate: b.due_date
    });

    window.open(url, '_blank');
  };

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6">
      
      {/* Top Header & Floor Filter Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:bg-cyan-500/15 dark:text-cyan-400 border border-sky-400/25 flex items-center justify-center shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            Rooms & Tenants Management (7 Rooms)
          </h2>
        </div>

        {/* Floor Filter Tabs */}
        <div className="flex items-center glass-card p-1 rounded-2xl border-slate-200/80 dark:border-white/10 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setActiveFloorFilter('ALL')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFloorFilter === 'ALL'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All 7 Rooms
          </button>
          <button
            onClick={() => setActiveFloorFilter(1)}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFloorFilter === 1
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1st Floor (4)
          </button>
          <button
            onClick={() => setActiveFloorFilter(2)}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFloorFilter === 2
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            2nd Floor (3)
          </button>
        </div>
      </div>

      {/* Grid of Redesigned Room Cards (Zero Overlapping, Direct Rent Textbox) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedRooms.map((room) => {
          const isOccupied = room.is_occupied;
          const tenant = room.tenant;
          const bill = room.current_bill;
          const hasPendingDues = bill && bill.balance_due > 0;
          const isFullyPaid = bill && bill.payment_status === 'PAID';

          return (
            <div
              key={room.room_id}
              className={`glass-card rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                isOccupied
                  ? hasPendingDues
                    ? 'border-rose-500/35 dark:border-rose-500/25 hover:border-rose-500/60 shadow-sm'
                    : 'border-slate-200/80 dark:border-white/15 hover:border-sky-500/50 dark:hover:border-cyan-400/40 shadow-sm'
                  : 'border-slate-200/80 dark:border-white/10 hover:border-sky-400/50 bg-slate-50/40 dark:bg-white/[0.015]'
              }`}
            >
              
              {/* TOP SECTION: IDENTIFICATION, RENT TEXTBOX, AND TENANT / VACANT INFO */}
              <div className="space-y-4">
                
                {/* 1. Room Number, Floor Tag & Occupancy Pill (Structured, No Overlap) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-sky-500/15 text-sky-700 dark:bg-cyan-500/20 dark:text-cyan-300 border border-sky-400/30 font-extrabold px-3 py-1.5 rounded-xl text-sm tracking-tight flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5" /> Room {room.room_number}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-2.5 py-1 rounded-xl">
                      Floor {room.floor_number}
                    </span>
                  </div>

                  {/* Occupancy Status Pill */}
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border flex items-center gap-1.5 ${
                    isOccupied
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-200/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/10'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {isOccupied ? 'Occupied' : 'Vacant'}
                  </span>
                </div>

                {/* 2. Room-Wise Monthly Rent Editable Textbox (Replaces Dropdown List) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                      Monthly Room Rent (₹)
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Editable Textbox
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-sm font-extrabold text-slate-500 dark:text-slate-400 pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={room.base_rent ?? ''}
                      onChange={(e) => onUpdateRent && onUpdateRent(room.room_id, e.target.value)}
                      className="glass-input w-full pl-7 pr-14 py-2 rounded-xl text-base font-extrabold text-sky-700 dark:text-cyan-300 bg-white dark:bg-slate-950 border-sky-400/40 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                    <span className="absolute right-3 text-xs font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
                      / month
                    </span>
                  </div>
                </div>

                {/* 3. Body Details: Occupied Tenant or Vacant State */}
                {isOccupied && tenant ? (
                  <div className="space-y-3 pt-1">
                    {/* Tenant Profile Bar with Avatar & Quick Edit */}
                    <div className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:bg-cyan-500/15 dark:text-cyan-300 border border-sky-400/25 flex items-center justify-center flex-shrink-0 shadow-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {tenant.full_name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <Phone className="w-3 h-3 text-sky-600 dark:text-cyan-400 flex-shrink-0" />
                            <span className="truncate">{tenant.phone_number}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 pl-1 border-l border-slate-200/60 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1 font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Deposit
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{formatINR(tenant.security_deposit)}
                        </span>
                      </div>
                    </div>

                    {/* Monthly Ledger Snapshot Box */}
                    {bill ? (
                      <div className="rounded-2xl p-3.5 bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
                        {/* Day-Wise / Bi-Monthly Electricity Breakdown */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            Light Bill {bill.is_bimonthly || (bill.cycle_days && bill.cycle_days > 31) ? '(2 Mo)' : (bill.prev_month_electricity_share > 0 ? '(50-50)' : '(Day-Wise)')}:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              ₹{formatINR((bill.electricity_share || 0) + (bill.prev_month_electricity_share || 0))}
                            </span>
                            {bill.prev_month_electricity_share > 0 ? (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded" title="Split 50% across 2 months">
                                2 Mo Split
                              </span>
                            ) : (bill.is_bimonthly || (bill.cycle_days && bill.cycle_days > 31)) ? (
                              <span className="text-[10px] font-bold text-sky-700 dark:text-cyan-300 bg-sky-500/15 px-1.5 py-0.5 rounded" title="60-Day Bi-Monthly cycle">
                                {bill.days_stayed || 60}d (2 Mo)
                              </span>
                            ) : bill.days_stayed && bill.days_stayed < 30 ? (
                              <span className="text-[10px] font-semibold text-sky-700 dark:text-cyan-300 bg-sky-500/10 px-1.5 py-0.2 rounded">
                                {bill.days_stayed}d
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Past Arrears if any */}
                        {bill.carried_forward_dues > 0 && (
                          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
                            <span>Past Pending Arrears:</span>
                            <span className="font-bold">+₹{formatINR(bill.carried_forward_dues)}</span>
                          </div>
                        )}

                        {/* Total Due & Status Pill */}
                        <div className="pt-2.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                              Total Balance Due
                            </span>
                            <span className={`text-base font-extrabold ${hasPendingDues ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              ₹{formatINR(bill.balance_due)}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                              isFullyPaid 
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                                : bill.payment_status === 'PARTIALLY_PAID'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            }`}>
                              {isFullyPaid ? (
                                <><CheckCircle2 className="w-3 h-3" /> Paid</>
                              ) : bill.payment_status === 'PARTIALLY_PAID' ? (
                                <><Clock className="w-3 h-3" /> Partial</>
                              ) : (
                                <><Clock className="w-3 h-3" /> Unpaid</>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl p-3 text-center border border-dashed border-slate-300 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                        No bill generated for this month yet.
                      </div>
                    )}
                  </div>
                ) : (
                  /* Clean Vacant State */
                  <div className="py-5 px-3 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Room Available for Rent
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Set custom rent in the textbox above, then click below to onboard a tenant.
                    </p>
                  </div>
                )}
              </div>

              {/* BOTTOM SECTION: ACTION BUTTONS (NO OVERFLOW, AMPLE TOUCH TARGETS) */}
              <div className="mt-5 pt-3.5 border-t border-slate-200/80 dark:border-white/10">
                {isOccupied ? (
                  <div className="space-y-2">
                    {/* Top Row: Reminder & Payment */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleWhatsAppClick(room)}
                        disabled={!hasPendingDues}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          hasPendingDues
                            ? 'glass-button-whatsapp text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/5 opacity-50'
                        }`}
                        title={hasPendingDues ? 'Send WhatsApp breakdown reminder' : 'No pending balance'}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reminder</span>
                      </button>

                      <button
                        onClick={() => onOpenPayment(room)}
                        className="glass-button-primary px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-sky-200" />
                        <span>Record Pay</span>
                      </button>
                    </div>

                    {/* Bottom Row: Edit Details, Full Ledger & Vacate */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => onOpenEditTenant && onOpenEditTenant(room)}
                        className="glass-button-secondary px-2 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 hover:text-sky-600 dark:hover:text-cyan-400 hover:border-sky-400/40 cursor-pointer"
                        title="Edit Tenant Details"
                      >
                        <Edit3 className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => onOpenLedger(room)}
                        className="glass-button-secondary px-2 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        title="View Full Ledger Statement"
                      >
                        <Receipt className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>Ledger</span>
                      </button>

                      <button
                        onClick={() => onOpenVacate(room)}
                        className="glass-button-secondary px-2 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-400/40 cursor-pointer"
                        title="Vacate Room & Settle"
                      >
                        <UserMinus className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                        <span>Vacate</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onOpenTenantEntry(room)}
                    className="w-full glass-button-primary py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <UserPlus className="w-4 h-4 text-sky-200" />
                    <span>Onboard Tenant for Room {room.room_number}</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
}
