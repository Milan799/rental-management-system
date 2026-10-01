import React, { useState } from 'react';
import { 
  Receipt, 
  MessageSquare, 
  MessageSquareText,
  CreditCard, 
  UserMinus, 
  CheckCircle2, 
  Clock, 
  Phone,
  Zap,
  Check
} from 'lucide-react';
import { 
  formatINR, 
  buildWhatsAppReminderUrl, 
  buildSmsReminderUrl, 
  buildReminderMessageText 
} from '../utils/whatsapp';
import MonthSelector from './MonthSelector';

export default function LedgerView({
  rooms = [],
  selectedMonth,
  setSelectedMonth,
  setActiveTab,
  onOpenPayment,
  onOpenVacate,
  onOpenLedger
}) {
  const occupiedRooms = rooms.filter(r => r.is_occupied);
  const [toast, setToast] = useState('');

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

  const handleSmsClick = (room) => {
    if (!room.tenant || !room.current_bill) return;

    const b = room.current_bill;
    const smsUrl = buildSmsReminderUrl({
      tenantName: room.tenant.full_name,
      roomNumber: room.room_number,
      phone: room.tenant.phone_number || room.tenant.whatsapp_number,
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

    const plainText = buildReminderMessageText({
      tenantName: room.tenant.full_name,
      roomNumber: room.room_number,
      phone: room.tenant.phone_number || room.tenant.whatsapp_number,
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
      dueDate: b.due_date,
      isSms: true
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(plainText).catch(() => {});
    }

    setToast(`SMS संदेश कॉपी हो गया! (कमरा ${room.room_number})`);
    setTimeout(() => setToast(''), 4500);

    // Open mobile native messaging app
    window.location.href = smsUrl;
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* Title & Month Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 border border-purple-400/25 flex items-center justify-center shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            Ledger, Dues & Reminders
          </h2>
        </div>
        <MonthSelector selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
      </div>

      {/* Instant SMS Copy / Action Toast Notification */}
      {toast && (
        <div className="p-3.5 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-800 dark:text-cyan-200 text-xs flex items-center gap-2.5 shadow-md animate-in fade-in">
          <Check className="w-4 h-4 text-sky-600 dark:text-cyan-400 flex-shrink-0" />
          <span className="font-semibold">{toast}</span>
        </div>
      )}

      {occupiedRooms.length === 0 ? (
        <div className="glass-modal rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 dark:border-white/15 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-sky-500/15 text-sky-600 dark:bg-cyan-500/20 dark:text-cyan-300 border border-sky-400/30 flex items-center justify-center">
            <Receipt className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              No Active Occupants Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              There are currently no active tenants assigned to rooms. Head over to the Rooms & Tenants tab to onboard tenants and track their ledger.
            </p>
          </div>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('rooms')}
              className="glass-button-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>Go to Rooms & Tenants</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* DESKTOP & LAPTOP VIEW: FULL DATA TABLE (Preserved)       */}
          {/* ======================================================== */}
          <div className="hidden md:block glass-modal rounded-3xl p-6 border border-slate-200/80 dark:border-white/15 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Room</th>
                <th className="py-3 px-3">Tenant & Contact</th>
                <th className="py-3 px-3 text-right">Fixed Rent</th>
                <th className="py-3 px-3 text-right">Electricity (Light Bill)</th>
                <th className="py-3 px-3 text-right">Arrears</th>
                <th className="py-3 px-3 text-right">Total Payable</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/5 text-slate-700 dark:text-slate-200">
              {occupiedRooms.map(room => {
                const bill = room.current_bill;
                const tenant = room.tenant;
                const hasPending = bill && bill.balance_due > 0;
                const isPaid = bill && bill.payment_status === 'PAID';
                const days = bill?.days_stayed;

                return (
                  <tr key={room.room_id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    
                    {/* Room */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sky-700 dark:text-cyan-300 text-sm">Room {room.room_number}</span>
                        <span className="text-[10px] text-slate-500 font-normal">F{room.floor_number}</span>
                      </div>
                    </td>

                    {/* Tenant */}
                    <td className="py-3 px-3">
                      <strong className="text-slate-900 dark:text-white block font-semibold">{tenant.full_name}</strong>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-sky-600 dark:text-cyan-400" /> {tenant.phone_number}
                      </span>
                    </td>

                    {/* Fixed Rent */}
                    <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-semibold">
                      ₹{formatINR(room.base_rent)}
                    </td>

                    {/* Electricity (Day-Wise / 2-Month) */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">
                        ₹{formatINR((bill?.electricity_share || 0) + (bill?.prev_month_electricity_share || 0))}
                      </span>
                      {bill?.prev_month_electricity_share > 0 ? (
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 block font-semibold">
                          (2 Mo 50-50)
                        </span>
                      ) : (bill?.is_bimonthly || (bill?.cycle_days && bill.cycle_days > 31)) ? (
                        <span className="text-[10px] text-sky-700 dark:text-cyan-300 block font-semibold">
                          ({days || 60}d 2-Month)
                        </span>
                      ) : days && days < 30 ? (
                        <span className="text-[10px] text-sky-600 dark:text-cyan-300 block font-semibold">
                          ({days} Days Active)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          (Full Month)
                        </span>
                      )}
                    </td>

                    {/* Past Arrears */}
                    <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-300 font-semibold">
                      ₹{formatINR(bill?.carried_forward_dues || 0)}
                    </td>

                    {/* Total Payable */}
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white text-sm">
                      ₹{formatINR(bill?.total_payable || room.base_rent)}
                    </td>

                    {/* Amount Paid */}
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                      ₹{formatINR(bill?.amount_paid || 0)}
                    </td>

                    {/* Balance Due */}
                    <td className="py-3 px-3 text-right">
                      <span className={`font-extrabold text-sm ${hasPending ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        ₹{formatINR(bill?.balance_due || 0)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isPaid
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : bill?.payment_status === 'PARTIALLY_PAID'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                      }`}>
                        {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {bill?.payment_status || 'UNPAID'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* WhatsApp Reminder Button */}
                        <button
                          onClick={() => handleWhatsAppClick(room)}
                          disabled={!hasPending}
                          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                            hasPending
                              ? 'glass-button-whatsapp text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/5 opacity-50'
                          }`}
                          title="WhatsApp पर हिंदी में बिल रिमाइंडर भेजें"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>

                        {/* Text SMS Button */}
                        <button
                          onClick={() => handleSmsClick(room)}
                          disabled={!hasPending}
                          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                            hasPending
                              ? 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-cyan-300 border border-sky-400/40 shadow-sm'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/5 opacity-50'
                          }`}
                          title="मोबाइल SMS ऐप खोलें / संदेश कॉपी करें"
                        >
                          <MessageSquareText className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                          <span className="hidden sm:inline">SMS</span>
                        </button>

                        {/* Pay Button */}
                        <button
                          onClick={() => onOpenPayment(room)}
                          className="glass-button-primary p-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                          title="Record Cash/UPI payment"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Pay</span>
                        </button>

                        {/* Full Ledger */}
                        <button
                          onClick={() => onOpenLedger(room)}
                          className="glass-button-secondary p-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                          title="View Ledger Statement"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        {/* Vacate / Settle */}
                        <button
                          onClick={() => onOpenVacate(room)}
                          className="glass-button-secondary p-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-400/30 cursor-pointer"
                          title="Vacate and settle security deposit"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE VIEW: SLEEK TOUCH-FRIENDLY CARDS (No Scroll)     */}
      {/* ======================================================== */}
      <div className="block md:hidden space-y-3.5">
        {occupiedRooms.map(room => {
          const bill = room.current_bill;
          const tenant = room.tenant;
          const hasPending = bill && bill.balance_due > 0;
          const isPaid = bill && bill.payment_status === 'PAID';
          const days = bill?.days_stayed;

          return (
            <div 
              key={room.room_id}
              className="glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
            >
              {/* Card Header: Room & Payment Status */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500/20 to-blue-500/20 text-sky-700 dark:text-cyan-300 border border-sky-400/30 flex items-center justify-center font-extrabold text-xs">
                    {room.room_number}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      Room {room.room_number}
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Floor {room.floor_number}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  isPaid
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : bill?.payment_status === 'PARTIALLY_PAID'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                }`}>
                  {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {bill?.payment_status || 'UNPAID'}
                </span>
              </div>

              {/* Tenant Contact Bar */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tenant</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {tenant?.full_name || 'No Tenant'}
                  </p>
                </div>
                {tenant?.phone_number && (
                  <a 
                    href={`tel:${tenant.phone_number}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 text-sky-600 dark:text-cyan-400 font-semibold text-xs border border-slate-200/80 dark:border-white/10"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{tenant.phone_number}</span>
                  </a>
                )}
              </div>

              {/* Itemized Cost Breakdown (Fixed Rent, Light Bill Day-wise, Arrears) */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">Fixed Rent</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">₹{formatINR(room.base_rent)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block uppercase font-medium">
                    Light Bill {bill?.prev_month_electricity_share > 0 ? '(2 Mo Split)' : (bill?.is_bimonthly || (bill?.cycle_days && bill.cycle_days > 31)) ? `(${days || 60}d)` : (days && days < 30 ? `(${days}d)` : '')}
                  </span>
                  <span className="font-extrabold text-amber-700 dark:text-amber-300 text-xs">
                    ₹{formatINR((bill?.electricity_share || 0) + (bill?.prev_month_electricity_share || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-500 dark:text-rose-400 block uppercase font-medium">Arrears</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-300 text-xs">₹{formatINR(bill?.carried_forward_dues || 0)}</span>
                </div>
              </div>

              {/* Total & Balance Summary */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Total Payable</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ₹{formatINR(bill?.total_payable || room.base_rent)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Balance Due</span>
                  <span className={`text-base font-extrabold ${hasPending ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    ₹{formatINR(bill?.balance_due || 0)}
                  </span>
                </div>
              </div>

              {/* Primary Actions: WhatsApp & SMS Reminders */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* WhatsApp Reminder */}
                <button
                  onClick={() => handleWhatsAppClick(room)}
                  disabled={!hasPending}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    hasPending
                      ? 'glass-button-whatsapp text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/5 opacity-50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* Text SMS */}
                <button
                  onClick={() => handleSmsClick(room)}
                  disabled={!hasPending}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    hasPending
                      ? 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-cyan-300 border border-sky-400/40 shadow-sm'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/5 opacity-50'
                  }`}
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                  <span>Text SMS</span>
                </button>
              </div>

              {/* Record Payment Full Width */}
              <button
                onClick={() => onOpenPayment(room)}
                className="w-full glass-button-primary py-2 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Pay</span>
              </button>

              {/* Secondary Actions: Full Ledger & Vacate */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-white/5">
                <button
                  onClick={() => onOpenLedger(room)}
                  className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Receipt className="w-3.5 h-3.5 text-sky-500" />
                  <span>Full Ledger History</span>
                </button>
                <button
                  onClick={() => onOpenVacate(room)}
                  className="py-1.5 px-3 rounded-xl text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Vacate</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>
      </>
      )}

    </div>
  );
}
