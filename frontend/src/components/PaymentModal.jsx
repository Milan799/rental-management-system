import React, { useState } from 'react';
import { X, CreditCard, Check, AlertCircle, Banknote, QrCode, IndianRupee } from 'lucide-react';
import { formatINR } from '../utils/whatsapp';

export default function PaymentModal({
  isOpen,
  onClose,
  room,
  onRecordPayment
}) {
  if (!isOpen || !room || !room.current_bill) return null;

  const bill = room.current_bill;
  const [amount, setAmount] = useState(bill.balance_due || 0);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const paidVal = Number(amount);
    if (!paidVal || paidVal <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }
    if (paidVal > bill.balance_due) {
      setError(`Payment cannot exceed outstanding dues of ₹${formatINR(bill.balance_due)}.`);
      return;
    }

    onRecordPayment({
      roomId: room.room_id,
      billId: bill.id,
      amountPaid: paidVal,
      paymentMode,
      transactionReference: transactionRef,
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="glass-modal rounded-3xl w-full max-w-md border border-slate-200/80 dark:border-white/20 p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-400/30 flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Record Payment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Room {room.room_number} • {room.tenant?.full_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Bill Summary Pill */}
        <div className="mt-4 glass-card p-4 rounded-2xl border-slate-200/80 dark:border-white/10 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Total Bill Payable:</span>
            <span className="font-semibold text-slate-900 dark:text-white">₹{formatINR(bill.total_payable)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Already Paid:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{formatINR(bill.amount_paid)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex justify-between text-sm font-bold">
            <span className="text-slate-700 dark:text-slate-200">Pending Balance:</span>
            <span className="text-rose-600 dark:text-rose-400">₹{formatINR(bill.balance_due)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Amount Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
              Payment Amount (₹) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-extrabold text-slate-500 dark:text-slate-400 pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="glass-input w-full pl-8 pr-3 py-2.5 rounded-xl text-base sm:text-lg font-extrabold text-sky-700 dark:text-cyan-300"
              />
            </div>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setAmount(bill.balance_due)}
                className="text-[11px] text-sky-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                Pay Full Balance (₹{formatINR(bill.balance_due)})
              </button>
            </div>
          </div>

          {/* Payment Mode Selector - ONLY UPI & CASH (Bank Transfer Removed) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'UPI', label: 'UPI / QR', icon: QrCode, badge: 'Online' },
                { id: 'CASH', label: 'Cash', icon: Banknote, badge: 'Direct' }
              ].map(mode => {
                const Icon = mode.icon;
                const isSelected = paymentMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMode(mode.id)}
                    className={`py-3 px-3 rounded-2xl text-xs font-semibold border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-400/60 text-sky-700 dark:text-cyan-300 ring-2 ring-sky-400/30 shadow-md'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{mode.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({mode.badge})</span>
                  </button>
                );
              })}
            </div>

            {paymentMode === 'UPI' && (
              <div className="mt-2.5 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 flex items-center justify-between text-xs text-sky-800 dark:text-cyan-300 shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Landlord UPI ID (Milan Javiya):</span>
                  <code className="font-mono font-bold text-xs select-all">milanjaviya971-3@okaxis</code>
                </div>
                <span className="text-[10px] font-semibold bg-sky-500/10 text-sky-700 dark:text-cyan-300 px-2 py-0.5 rounded-md">Axis Bank</span>
              </div>
            )}
          </div>

          {/* Reference Number */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Transaction ID / UTR / Receipt Ref
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="glass-input w-full px-3.5 py-2 rounded-xl text-xs"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input w-full px-3.5 py-2 rounded-xl text-xs"
            />
          </div>

          {/* Submit */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="glass-button-secondary px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-button-primary px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Update Ledger</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
