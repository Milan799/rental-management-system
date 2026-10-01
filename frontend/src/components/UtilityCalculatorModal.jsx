import React, { useState } from 'react';
import { X, Zap, Droplets, Wrench, Calendar, Calculator, Check, ArrowRight } from 'lucide-react';
import { formatINR } from '../utils/whatsapp';

export default function UtilityCalculatorModal({
  isOpen,
  onClose,
  rooms = [],
  billingMonth,
  onGenerateBills
}) {
  const [electricity, setElectricity] = useState(3900);
  const [water, setWater] = useState(1600);
  const [maintenance, setMaintenance] = useState(1000);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('Monthly regular utility split');

  if (!isOpen) return null;

  const occupiedRooms = rooms.filter(r => r.is_occupied);
  const occupiedCount = occupiedRooms.length || 1;

  // Real-time calculation per active room
  const perRoomElectricity = Number((Number(electricity || 0) / occupiedCount).toFixed(2));
  const perRoomWater = Number((Number(water || 0) / occupiedCount).toFixed(2));
  const perRoomMaintenance = Number((Number(maintenance || 0) / occupiedCount).toFixed(2));
  const perRoomTotalUtility = perRoomElectricity + perRoomWater + perRoomMaintenance;

  const handleConfirm = () => {
    onGenerateBills({
      billingMonth,
      totalElectricity: Number(electricity),
      totalWater: Number(water),
      commonMaintenance: Number(maintenance),
      dueDate,
      notes,
      perRoomElectricity,
      perRoomWater,
      perRoomMaintenance
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="glass-modal rounded-3xl w-full max-w-2xl border border-white/20 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Monthly Utility & Expense Calculator</h3>
              <p className="text-xs text-slate-400">Distribute master bills equally across all {occupiedCount} occupied rooms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {/* Electricity */}
          <div className="glass-card p-4 rounded-2xl border-white/10">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Building Electricity (₹)
            </label>
            <input
              type="number"
              min="0"
              value={electricity}
              onChange={(e) => setElectricity(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-base font-bold text-amber-300"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              = ₹{formatINR(perRoomElectricity)} / room
            </span>
          </div>

          {/* Water */}
          <div className="glass-card p-4 rounded-2xl border-white/10">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Droplets className="w-3.5 h-3.5 text-blue-400" /> Building Water Bill (₹)
            </label>
            <input
              type="number"
              min="0"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-base font-bold text-blue-300"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              = ₹{formatINR(perRoomWater)} / room
            </span>
          </div>

          {/* Maintenance */}
          <div className="glass-card p-4 rounded-2xl border-white/10">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Wrench className="w-3.5 h-3.5 text-purple-400" /> Common Maintenance (₹)
            </label>
            <input
              type="number"
              min="0"
              value={maintenance}
              onChange={(e) => setMaintenance(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-base font-bold text-purple-300"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              = ₹{formatINR(perRoomMaintenance)} / room
            </span>
          </div>
        </div>

        {/* Due Date & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="glass-card p-3 rounded-2xl border-white/10">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Payment Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="glass-input w-full px-3 py-1.5 rounded-xl text-xs font-medium"
            />
          </div>

          <div className="glass-card p-3 rounded-2xl border-white/10">
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              Batch Remarks / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input w-full px-3 py-1.5 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Real-time Room Impact Breakdown Preview */}
        <div className="mt-5 glass-card p-4 rounded-2xl border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-3">
            <span>Per Occupied Room Share Preview:</span>
            <span className="text-cyan-400">Fixed Rent + ₹{formatINR(perRoomTotalUtility)} Utilities</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {occupiedRooms.map(room => {
              const totalPayable = Number(room.base_rent) + perRoomTotalUtility;
              return (
                <div key={room.room_id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-300">Room {room.room_number}</span>
                    <span className="text-slate-400">({room.tenant?.full_name})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">₹{formatINR(room.base_rent)} + ₹{formatINR(perRoomTotalUtility)} =</span>
                    <strong className="text-white font-bold">₹{formatINR(totalPayable)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="glass-button-secondary px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="glass-button-primary px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span>Generate & Commit Bills</span>
          </button>
        </div>

      </div>
    </div>
  );
}
