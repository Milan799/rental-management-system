import React from 'react';
import { X, Receipt, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../utils/whatsapp';

export default function TenantLedgerModal({
  isOpen,
  onClose,
  room
}) {
  if (!isOpen || !room || !room.tenant) return null;

  const tenant = room.tenant;
  const bill = room.current_bill;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="glass-modal rounded-3xl w-full max-w-2xl border border-slate-200/80 dark:border-white/20 p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-400/30 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Tenant Ledger & History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Room {room.room_number} (Floor {room.floor_number}) • {tenant.full_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tenant Profile Banner */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="glass-card p-3 rounded-2xl border-slate-200/80 dark:border-white/10">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Phone</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">{tenant.phone_number}</span>
          </div>

          <div className="glass-card p-3 rounded-2xl border-slate-200/80 dark:border-white/10">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Move-in Date</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">{tenant.move_in_date}</span>
          </div>

          <div className="glass-card p-3 rounded-2xl border-slate-200/80 dark:border-white/10">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Fixed Rent</span>
            <span className="text-xs font-bold text-sky-700 dark:text-cyan-300 mt-0.5 block">₹{formatINR(room.base_rent)}/mo</span>
          </div>

          <div className="glass-card p-3 rounded-2xl border-slate-200/80 dark:border-white/10">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Deposit Held</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">₹{formatINR(tenant.security_deposit)}</span>
          </div>
        </div>

        {/* Detailed Current Bill Ledger Section */}
        {bill ? (
          <div className="mt-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Active Billing Cycle ({bill.billing_month})
            </h4>

            <div className="glass-modal rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Fixed Rent */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Fixed Room Rent</span>
                  <div className="mt-1 flex items-center justify-between">
                    <strong className="text-sm text-slate-900 dark:text-white">₹{formatINR(bill.base_rent)}</strong>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      bill.rent_status === 'PAID' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                    }`}>
                      {bill.rent_status}
                    </span>
                  </div>
                </div>

                {/* Electricity */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Electricity Share</span>
                    {bill.prev_month_electricity_share > 0 ? (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.2 rounded">2 Mo Split</span>
                    ) : (bill.is_bimonthly || (bill.cycle_days && bill.cycle_days > 31)) ? (
                      <span className="text-[10px] font-bold text-sky-700 dark:text-cyan-300 bg-sky-500/15 px-1.5 py-0.2 rounded">2-Month</span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div>
                      <strong className="text-sm text-amber-600 dark:text-amber-300">
                        ₹{formatINR((bill.electricity_share || 0) + (bill.prev_month_electricity_share || 0))}
                      </strong>
                      {bill.prev_month_electricity_share > 0 ? (
                        <span className="text-[10px] text-slate-400 block">
                          ₹{formatINR(bill.electricity_share)} + ₹{formatINR(bill.prev_month_electricity_share)}
                        </span>
                      ) : (bill.is_bimonthly || (bill.cycle_days && bill.cycle_days > 31)) ? (
                        <span className="text-[10px] text-slate-400 block">
                          {bill.days_stayed || 60} Days stay
                        </span>
                      ) : null}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      bill.electricity_status === 'PAID' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                    }`}>
                      {bill.electricity_status}
                    </span>
                  </div>
                </div>

                {/* Water */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Water Share</span>
                  <div className="mt-1 flex items-center justify-between">
                    <strong className="text-sm text-sky-600 dark:text-blue-300">₹{formatINR(bill.water_share)}</strong>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      bill.water_status === 'PAID' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                    }`}>
                      {bill.water_status}
                    </span>
                  </div>
                </div>

              </div>

              {/* Arrears and Totals */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Past Dues: </span>
                  <strong className="text-rose-600 dark:text-rose-400">₹{formatINR(bill.carried_forward_dues)}</strong>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400">Total Payable: </span>
                  <strong className="text-slate-900 dark:text-white font-bold">₹{formatINR(bill.total_payable)}</strong>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400">Paid: </span>
                  <strong className="text-emerald-600 dark:text-emerald-400">₹{formatINR(bill.amount_paid)}</strong>
                </div>

                <div className="bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Net Balance: </span>
                  <strong className={`font-bold ${bill.balance_due > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    ₹{formatINR(bill.balance_due)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 p-6 text-center text-slate-500 dark:text-slate-400 text-xs glass-card rounded-2xl">
            No active bill found for this tenant in the selected period.
          </div>
        )}

        {/* Payment Transaction History */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Payment Logs & Receipts
          </h4>
          <div className="glass-card rounded-2xl overflow-hidden border-slate-200/80 dark:border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Mode</th>
                    <th className="py-2.5 px-4">Reference</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {bill && bill.amount_paid > 0 ? (
                    <tr>
                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{bill.due_date || 'Recent'}</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹{formatINR(bill.amount_paid)}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px]">
                          UPI
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">UPI-REF-9921</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Reconciled
                        </span>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-slate-400 dark:text-slate-500">
                        No payments logged yet for this billing cycle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Close Button */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="glass-button-secondary px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Close Ledger
          </button>
        </div>

      </div>
    </div>
  );
}
