import React, { useState } from 'react';
import { X, UserMinus, Check, Calculator, AlertTriangle } from 'lucide-react';
import { formatINR } from '../utils/whatsapp';

export default function VacateModal({
  isOpen,
  onClose,
  room,
  onFinalizeSettlement
}) {
  if (!isOpen || !room || !room.tenant) return null;

  const tenant = room.tenant;
  const bill = room.current_bill;
  const pendingDues = bill ? Number(bill.balance_due || 0) : 0;
  const securityDeposit = Number(tenant.security_deposit || 0);

  const [damageDeduction, setDamageDeduction] = useState(0);
  const [settlementNotes, setSettlementNotes] = useState('Standard move-out inspection completed');
  const [vacateDate, setVacateDate] = useState(() => new Date().toISOString().split('T')[0]);

  const totalDeductions = pendingDues + Number(damageDeduction || 0);
  const netRefundable = securityDeposit - totalDeductions;
  const isRefundToTenant = netRefundable >= 0;

  const handleConfirm = () => {
    onFinalizeSettlement({
      roomId: room.room_id,
      tenantId: tenant.id,
      securityDeposit,
      pendingDuesDeducted: pendingDues,
      damageDeducted: Number(damageDeduction || 0),
      netRefundable,
      vacateDate,
      settlementNotes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="glass-modal rounded-3xl w-full max-w-lg border border-slate-200/80 dark:border-white/20 p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-400/30 flex items-center justify-center">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Tenant Settlement & Vacating</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Reconcile security deposit and free up Room {room.room_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tenant Summary */}
        <div className="mt-4 glass-card p-4 rounded-2xl border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Occupant</span>
            <strong className="text-sm font-bold text-slate-900 dark:text-white">{tenant.full_name}</strong>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Stayed since: {tenant.move_in_date}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 dark:text-slate-400 block">Security Deposit Held</span>
            <strong className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">₹{formatINR(securityDeposit)}</strong>
          </div>
        </div>

        {/* Settlement Reconciliation Math Card */}
        <div className="mt-4 glass-modal p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" /> Deposit Reconciliation
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Security Deposit in Hand:</span>
              <span className="font-bold text-slate-900 dark:text-white">+₹{formatINR(securityDeposit)}</span>
            </div>

            <div className="flex justify-between text-rose-600 dark:text-rose-300">
              <span>Less: Unpaid Utility & Rent Dues:</span>
              <span className="font-bold">-₹{formatINR(pendingDues)}</span>
            </div>

            {/* Damage / Repair deduction input */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-3">
              <label className="text-slate-700 dark:text-slate-300">Less: Damages / Repairs:</label>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  value={damageDeduction}
                  onChange={(e) => setDamageDeduction(e.target.value)}
                  className="glass-input w-full px-2 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-300 text-right"
                />
              </div>
            </div>

            {/* Net Settlement Balance */}
            <div className={`mt-3 pt-3 border-t border-slate-200/80 dark:border-white/15 p-3 rounded-xl flex items-center justify-between ${
              isRefundToTenant ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'
            }`}>
              <div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  {isRefundToTenant ? 'Net Amount to Refund Tenant:' : 'Outstanding to Recover:'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {isRefundToTenant ? 'Via UPI / Bank Transfer' : 'Tenant owes balance'}
                </span>
              </div>
              <span className={`text-xl font-extrabold ${isRefundToTenant ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                ₹{formatINR(Math.abs(netRefundable))}
              </span>
            </div>
          </div>
        </div>

        {/* Vacate Date & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Vacating Date</label>
            <input
              type="date"
              value={vacateDate}
              onChange={(e) => setVacateDate(e.target.value)}
              className="glass-input w-full px-3 py-1.5 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Settlement Remarks</label>
            <input
              type="text"
              value={settlementNotes}
              onChange={(e) => setSettlementNotes(e.target.value)}
              className="glass-input w-full px-3 py-1.5 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Warning Note */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            Executing settlement will mark all dues as settled, archive <strong>{tenant.full_name}</strong>, and set <strong>Room {room.room_number}</strong> as vacant.
          </span>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="glass-button-secondary px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer shadow-md bg-rose-600 hover:bg-rose-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Settle & Release Room</span>
          </button>
        </div>

      </div>
    </div>
  );
}
