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
  Edit3,
  User,
  ShieldCheck,
  DoorOpen,
  Sparkles
} from 'lucide-react';
import { formatINR, buildWhatsAppReminderUrl } from '../utils/whatsapp';
import { useLanguage } from '../context/LanguageContext';

function RoomCard({
  room,
  selectedMonth,
  onUpdateRent,
  onOpenTenantEntry,
  onOpenEditTenant,
  onOpenLedger,
  onOpenPayment,
  onOpenVacate,
  handleWhatsAppClick
}) {
  const { t, language } = useLanguage();
  const isOccupied = room.is_occupied;
  const tenant = room.tenant;
  const bill = room.current_bill;
  const hasPendingDues = bill && bill.balance_due > 0;
  const isFullyPaid = bill && bill.payment_status === 'PAID';

  return (
    <div
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
        
        {/* 1. Room Number, Floor Tag & Occupancy Pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/15 text-sky-700 dark:bg-cyan-500/20 dark:text-cyan-300 border border-sky-400/30 font-extrabold px-3 py-1.5 rounded-xl text-sm tracking-tight flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" /> {language === 'gu' ? `રૂમ ${room.room_number}` : `Room ${room.room_number}`}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-2.5 py-1 rounded-xl">
              {language === 'gu' ? `માળ ${room.floor_number}` : `Floor ${room.floor_number}`}
            </span>
          </div>

          {/* Occupancy Status Pill */}
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border flex items-center gap-1.5 ${
            isOccupied
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-slate-200/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/10'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isOccupied ? t('occupied', 'Occupied') : t('vacant', 'Vacant')}
          </span>
        </div>

        {/* 2. Body Details: Occupied Tenant or Clean Vacant State */}
        {isOccupied && tenant ? (
          <div className="space-y-3 pt-1">
            {/* Tenant Profile Bar with Quick Info */}
            <div className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:bg-cyan-500/15 dark:text-cyan-300 border border-sky-400/25 flex items-center justify-center flex-shrink-0 shadow-xs font-bold text-sm">
                  {tenant.full_name ? tenant.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
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

              <div className="text-right flex-shrink-0 pl-2 border-l border-slate-200/60 dark:border-white/5 space-y-0.5">
                <div className="text-xs font-bold text-sky-700 dark:text-cyan-300">
                  ₹{formatINR(room.base_rent)}<span className="text-[10px] text-slate-400 font-normal">/mo</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> ₹{formatINR(tenant.security_deposit)}
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
                    {language === 'gu' ? 'વીજળી બિલ:' : 'Light Bill:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      ₹{formatINR((bill.electricity_share || 0) + (bill.prev_month_electricity_share || 0))}
                    </span>
                  </div>
                </div>

                {/* Past Arrears if any */}
                {bill.carried_forward_dues > 0 && (
                  <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
                    <span>{language === 'gu' ? 'પાછલી બાકી રકમ:' : 'Past Pending Arrears:'}</span>
                    <span className="font-bold">+₹{formatINR(bill.carried_forward_dues)}</span>
                  </div>
                )}

                {/* Total Due & Status Pill */}
                <div className="pt-2.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      {t('balance_due', 'Total Balance Due')}
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
                        <><CheckCircle2 className="w-3 h-3" /> {t('paid', 'Paid')}</>
                      ) : bill.payment_status === 'PARTIALLY_PAID' ? (
                        <><Clock className="w-3 h-3" /> {t('partially_paid', 'Partial')}</>
                      ) : (
                        <><Clock className="w-3 h-3" /> {t('unpaid', 'Unpaid')}</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-3 text-center border border-dashed border-slate-300 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                {language === 'gu' ? 'આ મહિના માટે હજુ બિલ બન્યું નથી.' : 'No bill generated for this month yet.'}
              </div>
            )}
          </div>
        ) : (
          /* Clean & Elegant Vacant State Card */
          <div className="py-5 px-4 rounded-2xl bg-gradient-to-b from-sky-500/5 via-sky-500/[0.02] to-transparent dark:from-cyan-500/10 dark:via-transparent border border-sky-400/20 dark:border-white/10 text-center flex flex-col items-center justify-center space-y-2.5 shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 dark:bg-cyan-500/15 border border-sky-400/30 flex items-center justify-center text-sky-600 dark:text-cyan-300 shadow-sm">
              <DoorOpen className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {language === 'gu' ? 'માસિક ભાડું' : 'Monthly Base Rent'}
              </span>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  ₹{formatINR(room.base_rent || 0)}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {language === 'gu' ? '/ મહિનો' : '/ mo'}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>{language === 'gu' ? 'રૂમ ખાલી છે • ભાડે આપવા તૈયાર' : 'Room Vacant & Available'}</span>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: ACTION BUTTONS */}
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
                <span>{language === 'gu' ? 'યાદ અપાવો' : 'Reminder'}</span>
              </button>

              <button
                onClick={() => onOpenPayment(room)}
                className="glass-button-primary px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5 text-sky-200" />
                <span>{language === 'gu' ? 'પેમેન્ટ નોંધો' : 'Record Pay'}</span>
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
                <span>{t('edit_tenant', 'Edit')}</span>
              </button>

              <button
                onClick={() => onOpenLedger(room)}
                className="glass-button-secondary px-2 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                title="View Full Ledger Statement"
              >
                <Receipt className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>{t('view_ledger_btn', 'Ledger')}</span>
              </button>

              <button
                onClick={() => onOpenVacate(room)}
                className="glass-button-secondary px-2 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-400/40 cursor-pointer"
                title="Vacate Room & Settle"
              >
                <UserMinus className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                <span>{t('vacate_room', 'Vacate')}</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onOpenTenantEntry(room)}
            className="w-full glass-button-primary py-3 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-[1.01]"
          >
            <UserPlus className="w-4 h-4 text-sky-200" />
            <span>{language === 'gu' ? `રૂમ ${room.room_number} માટે ભાડૂઆત ઉમેરો` : `Onboard Tenant (Room ${room.room_number})`}</span>
          </button>
        )}
      </div>

    </div>
  );
}

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
  const { t, language } = useLanguage();
  const [activeFloorFilter, setActiveFloorFilter] = useState('ALL');

  // Separate rooms by floor
  const floor1Rooms = rooms.filter(r => r.floor_number === 1);
  const floor2Rooms = rooms.filter(r => r.floor_number === 2);

  const floor1Occupied = floor1Rooms.filter(r => r.is_occupied).length;
  const floor2Occupied = floor2Rooms.filter(r => r.is_occupied).length;

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

  const sharedCardProps = {
    selectedMonth,
    onUpdateRent,
    onOpenTenantEntry,
    onOpenEditTenant,
    onOpenLedger,
    onOpenPayment,
    onOpenVacate,
    handleWhatsAppClick
  };

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      
      {/* Top Header & Floor Filter Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:bg-cyan-500/15 dark:text-cyan-400 border border-sky-400/25 flex items-center justify-center shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            {language === 'gu' ? 'રૂમ અને ભાડૂઆત વ્યવસ્થાપન (૭ રૂમ)' : 'Rooms & Tenants Management (7 Rooms)'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'gu' ? 'માળ મુજબ રૂમ ફાળવણી, ભાડું ફેરફાર અને ભાડૂઆત પ્રોફાઇલ' : 'Floor-wise organized room allocation, rent editing & tenant profiles'}
          </p>
        </div>

        {/* Floor Filter Tabs */}
        <div className="flex items-center glass-card p-1 rounded-2xl border-slate-200/80 dark:border-white/10 w-full sm:w-auto justify-between sm:justify-start shadow-xs">
          <button
            onClick={() => setActiveFloorFilter('ALL')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFloorFilter === 'ALL'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'gu' ? 'બધા માળ (૧ અને ૨)' : 'All Floors (1 & 2)'}
          </button>
          <button
            onClick={() => setActiveFloorFilter(1)}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFloorFilter === 1
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'gu' ? 'પહેલો માળ (૪)' : '1st Floor (4)'}
          </button>
          <button
            onClick={() => setActiveFloorFilter(2)}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFloorFilter === 2
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'gu' ? 'બીજો માળ (૩)' : '2nd Floor (3)'}
          </button>
        </div>
      </div>

      {/* FLOOR 1 SECTION: Rooms 101 to 104 */}
      {(activeFloorFilter === 'ALL' || activeFloorFilter === 1) && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl glass-card border border-sky-500/25 dark:border-sky-500/20 bg-sky-500/5 dark:bg-sky-500/[0.03] gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-700 dark:text-cyan-300 font-extrabold text-sm flex items-center justify-center border border-sky-400/30">
                1F
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{language === 'gu' ? 'પહેલો માળ' : '1st Floor'}</span>
                  <span className="text-xs font-bold text-sky-700 dark:text-cyan-300 bg-sky-500/15 px-2 py-0.5 rounded-full">
                    {language === 'gu' ? 'રૂમ ૧૦૧ - ૧૦૪ (૪ રૂમ)' : 'Rooms 101 – 104 (4 Rooms)'}
                  </span>
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'gu' ? 'સ્વતંત્ર વીજળી મીટર સાથે ગ્રાઉન્ડ લેવલ રૂમ' : 'Ground level rooms with independent electricity tracking'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20">
                {floor1Occupied} {language === 'gu' ? 'ભરેલ' : 'Occupied'}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-white/10">
                {floor1Rooms.length - floor1Occupied} {language === 'gu' ? 'ખાલી' : 'Vacant'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {floor1Rooms.map((room) => (
              <RoomCard
                key={room.room_id}
                room={room}
                {...sharedCardProps}
              />
            ))}
          </div>
        </div>
      )}

      {/* Visual Separation Divider */}
      {activeFloorFilter === 'ALL' && (
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/80 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 font-semibold">
              {language === 'gu' ? 'માળ વિભાજક' : 'Floor Separator'}
            </span>
          </div>
        </div>
      )}

      {/* FLOOR 2 SECTION: Rooms 201 to 203 */}
      {(activeFloorFilter === 'ALL' || activeFloorFilter === 2) && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl glass-card border border-blue-500/25 dark:border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/[0.03] gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300 font-extrabold text-sm flex items-center justify-center border border-blue-400/30">
                2F
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{language === 'gu' ? 'બીજો માળ' : '2nd Floor'}</span>
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full">
                    {language === 'gu' ? 'રૂમ ૨૦૧ - ૨૦૩ (૩ રૂમ)' : 'Rooms 201 – 203 (3 Rooms)'}
                  </span>
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'gu' ? 'ઉપલા માળના પ્રીમિયમ રૂમ' : 'Upper floor rooms with terrace access'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20">
                {floor2Occupied} {language === 'gu' ? 'ભરેલ' : 'Occupied'}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-white/10">
                {floor2Rooms.length - floor2Occupied} {language === 'gu' ? 'ખાલી' : 'Vacant'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {floor2Rooms.map((room) => (
              <RoomCard
                key={room.room_id}
                room={room}
                {...sharedCardProps}
              />
            ))}
          </div>
        </div>
      )}

    </section>
  );
}
