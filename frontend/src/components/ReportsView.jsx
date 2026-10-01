import React from 'react';
import { FileSpreadsheet, Download, Printer, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatINR, getTimeframeInfo, calculateRoomPeriodFigures } from '../utils/whatsapp';
import TimeframeFilter from './TimeframeFilter';

export default function ReportsView({
  rooms = [],
  selectedMonth,
  setSelectedMonth,
  timeframe = 'CURRENT_MONTH',
  setTimeframe
}) {
  const tfInfo = getTimeframeInfo(timeframe, selectedMonth);

  // Overall calculations for the chosen timeframe
  let totalExpected = 0;
  let totalCollected = 0;
  let totalPending = 0;
  let totalFixedRent = 0;
  let totalElectricity = 0;

  rooms.forEach(r => {
    if (r.is_occupied) {
      const figs = calculateRoomPeriodFigures(r, timeframe);
      totalExpected += figs.totalPayable;
      totalCollected += figs.amountPaid;
      totalPending += figs.balanceDue;
      totalFixedRent += figs.fixedRent;
      totalElectricity += figs.electricity;
    }
  });

  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const handleDownloadCSV = () => {
    const headers = [
      'Room Number',
      'Floor',
      'Tenant Name',
      'Contact',
      `Fixed Rent (${tfInfo.count} Mo) (INR)`,
      `Electricity Light Bill (${tfInfo.count} Mo) (INR)`,
      'Days Active',
      'Past Dues (INR)',
      'Total Payable (INR)',
      'Amount Paid (INR)',
      'Balance Due (INR)',
      'Payment Status'
    ];

    const rows = rooms.map(r => {
      const bill = r.current_bill;
      const tenant = r.tenant;
      const figs = calculateRoomPeriodFigures(r, timeframe);

      return [
        r.room_number,
        `Floor ${r.floor_number}`,
        tenant ? tenant.full_name : 'VACANT',
        tenant ? tenant.phone_number : 'N/A',
        figs.fixedRent,
        figs.electricity,
        bill ? (bill.days_stayed || (bill.is_bimonthly ? 60 : 30)) : 0,
        bill ? (bill.carried_forward_dues || 0) : 0,
        figs.totalPayable,
        figs.amountPaid,
        figs.balanceDue,
        figs.status
      ];
    });

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(e => e.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rental_Statement_7Rooms_${tfInfo.id}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* Page Title & Timeframe Selector Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 border border-purple-400/25 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            Financial Reports & Export
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Official rent roll, collections statement & audit export
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

      {/* Action Bar: High-Grade Responsive Mobile & Desktop Layout */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 sm:p-4 glass-card rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-white">Statement Scope:</span>
          <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-cyan-300 font-semibold border border-sky-500/20">
            {tfInfo.periodLabel}
          </span>
        </div>

        {/* Fixed Mobile Buttons Grid (2 Equal-Width Columns, Zero Wrapping) */}
        <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto sm:flex sm:items-center sm:gap-3">
          <button
            onClick={handleDownloadCSV}
            type="button"
            className="w-full sm:w-auto glass-button-primary px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
            title="Download CSV spreadsheet for Excel / Google Sheets"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Excel / CSV</span>
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className="w-full sm:w-auto glass-button-secondary px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
            title="Print or Save PDF Statement"
          >
            <Printer className="w-4 h-4 shrink-0 text-sky-600 dark:text-cyan-400" />
            <span className="whitespace-nowrap">Print PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Card */}
      <div className="glass-modal rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-white/15 shadow-sm" id="printable-report">
        
        {/* Letterhead */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 dark:border-white/10 gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">AERORENT PROPERTY STATEMENT (7 ROOMS)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Floor 1 (Rooms 101-104) • Floor 2 (Rooms 201-203)</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-sky-700 dark:text-cyan-300 font-semibold block">Billing Period: {tfInfo.periodLabel}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Date Generated: {new Date().toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        {/* Statement Summary KPI Strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Gross Billed</span>
            <strong className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">₹{formatINR(totalExpected)}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Fixed Rent Total</span>
            <strong className="text-sm sm:text-base font-extrabold text-sky-700 dark:text-cyan-300">₹{formatINR(totalFixedRent)}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Collected ({collectionRate}%)</span>
            <strong className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">₹{formatINR(totalCollected)}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Balance Receivables</span>
            <strong className={`text-sm sm:text-base font-extrabold ${totalPending > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              ₹{formatINR(totalPending)}
            </strong>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DESKTOP & PRINT: FULL STATEMENT DATA TABLE               */}
        {/* ======================================================== */}
        <div className="mt-4 overflow-x-auto -mx-4 sm:mx-0 hidden md:block print:block">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                <th className="py-2.5 px-3">Room</th>
                <th className="py-2.5 px-2">Floor</th>
                <th className="py-2.5 px-3">Tenant Name</th>
                <th className="py-2.5 px-3 text-right">Fixed Rent ({tfInfo.count === 1 ? 'Monthly' : `${tfInfo.count} Mo`})</th>
                <th className="py-2.5 px-3 text-right">Electricity ({tfInfo.count === 1 ? 'Light Bill' : `${tfInfo.count} Mo`})</th>
                <th className="py-2.5 px-3 text-right">Arrears</th>
                <th className="py-2.5 px-3 text-right">Total Payable</th>
                <th className="py-2.5 px-3 text-right">Paid</th>
                <th className="py-2.5 px-3 text-right">Balance Due</th>
                <th className="py-2.5 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/5 text-slate-700 dark:text-slate-200">
              {rooms.map(room => {
                const bill = room.current_bill;
                const isOccupied = room.is_occupied;
                const figs = calculateRoomPeriodFigures(room, timeframe);
                const days = bill?.days_stayed;
                return (
                  <tr key={room.room_id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-bold text-sky-700 dark:text-cyan-300">Room {room.room_number}</td>
                    <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400">Floor {room.floor_number}</td>
                    <td className="py-2.5 px-3">
                      {isOccupied ? (
                        <span className="font-semibold text-slate-900 dark:text-white">{room.tenant?.full_name}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">-- VACANT --</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 font-semibold">
                      ₹{formatINR(figs.fixedRent)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        ₹{formatINR(figs.electricity)}
                      </span>
                      {tfInfo.count > 1 ? (
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 block">
                          ({tfInfo.count} Mo Scope)
                        </span>
                      ) : bill?.prev_month_electricity_share > 0 ? (
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 block">
                          (2 Mo Split)
                        </span>
                      ) : (bill?.is_bimonthly || (bill?.cycle_days && bill.cycle_days > 31)) ? (
                        <span className="text-[10px] text-sky-600 dark:text-cyan-300 block">
                          ({days || 60}d 2-Mo)
                        </span>
                      ) : days && days < 30 ? (
                        <span className="text-[10px] text-sky-600 dark:text-cyan-300 block">
                          ({days}d)
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-300 font-semibold">₹{formatINR(bill?.carried_forward_dues || 0)}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">₹{formatINR(figs.totalPayable)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">₹{formatINR(figs.amountPaid)}</td>
                    <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-bold">₹{formatINR(figs.balanceDue)}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        figs.status === 'PAID'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : figs.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : isOccupied ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-white/5'
                      }`}>
                        {figs.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ======================================================== */}
        {/* MOBILE VIEW: SLEEK REPORT CARDS (Zero Horizontal Scroll) */}
        {/* ======================================================== */}
        <div className="block md:hidden print:hidden mt-3 space-y-3">
          {rooms.map(room => {
            const bill = room.current_bill;
            const isOccupied = room.is_occupied;
            const figs = calculateRoomPeriodFigures(room, timeframe);
            const isPaid = figs.status === 'PAID';
            const days = bill?.days_stayed;

            return (
              <div 
                key={room.room_id} 
                className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2.5"
              >
                {/* Room Header & Status */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-sky-700 dark:text-cyan-300">
                      Room {room.room_number}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Floor {room.floor_number}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    isPaid
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : figs.status === 'PARTIALLY_PAID'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : isOccupied 
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' 
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'
                  }`}>
                    {figs.status}
                  </span>
                </div>

                {/* Tenant Information */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tenant</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {isOccupied ? room.tenant?.full_name : <span className="text-slate-400 italic">-- VACANT --</span>}
                  </span>
                </div>

                {/* Itemized Share Breakdown (Fixed Rent, Light Bill Day-wise, Arrears) */}
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-white/80 dark:bg-black/20 border border-slate-200/60 dark:border-white/10 text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-medium">
                      Fixed Rent {tfInfo.count > 1 ? `(${tfInfo.count}m)` : ''}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">₹{formatINR(figs.fixedRent)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 block uppercase font-medium">
                      Light Bill {tfInfo.count > 1 ? `(${tfInfo.count}m)` : bill?.prev_month_electricity_share > 0 ? '(2 Mo)' : (bill?.is_bimonthly || (bill?.cycle_days && bill.cycle_days > 31)) ? `(${days || 60}d)` : (days && days < 30 ? `(${days}d)` : '')}
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-300 text-[11px]">
                      ₹{formatINR(figs.electricity)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-rose-500 dark:text-rose-400 block uppercase font-medium">Arrears</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px]">₹{formatINR(bill?.carried_forward_dues || 0)}</span>
                  </div>
                </div>

                {/* Totals Summary Row */}
                <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-200/50 dark:border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Total</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                      ₹{formatINR(figs.totalPayable)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Paid</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      ₹{formatINR(figs.amountPaid)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Balance Due</span>
                    <span className={`font-extrabold text-xs ${figs.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      ₹{formatINR(figs.balanceDue)}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer Authorization */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <span>Automated day-wise electricity calculation verified. Base room rent fixed.</span>
          <span>Authorized Landlord Signature: _______________________</span>
        </div>

      </div>

    </div>
  );
}
