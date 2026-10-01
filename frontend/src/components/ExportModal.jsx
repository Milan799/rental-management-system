import React from 'react';
import { X, Printer, Download, FileSpreadsheet, Building2, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../utils/whatsapp';

export default function ExportModal({
  isOpen,
  onClose,
  rooms = [],
  selectedMonth
}) {
  if (!isOpen) return null;

  // Generate Excel-compatible CSV
  const handleDownloadCSV = () => {
    const headers = [
      'Room Number',
      'Floor',
      'Tenant Name',
      'Contact',
      'Base Rent (INR)',
      'Electricity Share (INR)',
      'Water Share (INR)',
      'Past Dues (INR)',
      'Total Payable (INR)',
      'Amount Paid (INR)',
      'Balance Due (INR)',
      'Payment Status'
    ];

    const rows = rooms.map(r => {
      const bill = r.current_bill;
      const tenant = r.tenant;
      return [
        r.room_number,
        `Floor ${r.floor_number}`,
        tenant ? tenant.full_name : 'VACANT',
        tenant ? tenant.phone_number : 'N/A',
        r.base_rent,
        bill ? bill.electricity_share : 0,
        bill ? bill.water_share : 0,
        bill ? bill.carried_forward_dues : 0,
        bill ? bill.total_payable : (r.is_occupied ? r.base_rent : 0),
        bill ? bill.amount_paid : 0,
        bill ? bill.balance_due : (r.is_occupied ? r.base_rent : 0),
        bill ? bill.payment_status : (r.is_occupied ? 'NO_BILL' : 'VACANT')
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
    link.setAttribute('download', `Rental_Summary_7Rooms_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="glass-modal rounded-3xl w-full max-w-4xl border border-white/20 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Monthly Property Financial Report</h3>
              <p className="text-xs text-slate-400">Statement for billing period: {selectedMonth}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadCSV}
              className="glass-button-primary px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel/CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="glass-button-secondary px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 hover:text-white"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-200" id="printable-report">
          
          {/* Letterhead */}
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-extrabold text-white">SKYLINE RESIDENCY (2 FLOORS • 7 ROOMS)</h2>
              <p className="text-xs text-slate-400">Monthly Utility Split & Tenant Rent Reconciled Report</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Period: {selectedMonth}</span>
              <span className="text-xs text-cyan-400 font-semibold">Generated: {new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2 px-2">Room</th>
                  <th className="py-2 px-2">Floor</th>
                  <th className="py-2 px-3">Tenant</th>
                  <th className="py-2 px-2 text-right">Fixed Rent</th>
                  <th className="py-2 px-2 text-right">Elec.</th>
                  <th className="py-2 px-2 text-right">Water</th>
                  <th className="py-2 px-2 text-right">Arrears</th>
                  <th className="py-2 px-2 text-right">Total Payable</th>
                  <th className="py-2 px-2 text-right">Paid</th>
                  <th className="py-2 px-2 text-right">Due</th>
                  <th className="py-2 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rooms.map(room => {
                  const bill = room.current_bill;
                  const isOccupied = room.is_occupied;
                  return (
                    <tr key={room.room_id} className="hover:bg-white/[0.02]">
                      <td className="py-2 px-2 font-bold text-cyan-300">Room {room.room_number}</td>
                      <td className="py-2 px-2 text-slate-400">Floor {room.floor_number}</td>
                      <td className="py-2 px-3">
                        {isOccupied ? (
                          <span className="font-semibold text-white">{room.tenant?.full_name}</span>
                        ) : (
                          <span className="text-slate-500 italic">-- VACANT --</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">₹{formatINR(room.base_rent)}</td>
                      <td className="py-2 px-2 text-right text-slate-400">₹{formatINR(bill?.electricity_share || 0)}</td>
                      <td className="py-2 px-2 text-right text-slate-400">₹{formatINR(bill?.water_share || 0)}</td>
                      <td className="py-2 px-2 text-right text-rose-300">₹{formatINR(bill?.carried_forward_dues || 0)}</td>
                      <td className="py-2 px-2 text-right font-bold text-white">₹{formatINR(bill?.total_payable || 0)}</td>
                      <td className="py-2 px-2 text-right text-emerald-400 font-semibold">₹{formatINR(bill?.amount_paid || 0)}</td>
                      <td className="py-2 px-2 text-right text-rose-400 font-bold">₹{formatINR(bill?.balance_due || 0)}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          bill?.payment_status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : bill?.payment_status === 'PARTIALLY_PAID'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : isOccupied ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-slate-500/10 text-slate-400 border-white/5'
                        }`}>
                          {bill?.payment_status || (isOccupied ? 'UNPAID' : 'VACANT')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between text-xs text-slate-400">
            <span>Automated calculation verified with equal occupied room distribution.</span>
            <span>Landlord Property Signature: _______________________</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-white/10 flex justify-end no-print">
          <button
            onClick={onClose}
            className="glass-button-secondary px-5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
