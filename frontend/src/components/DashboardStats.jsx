import React from 'react';
import { Users, TrendingUp, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { formatINR } from '../utils/whatsapp';

export default function DashboardStats({ rooms = [], stats = null }) {
  // Compute totals if stats not provided by API
  const totalRooms = rooms.length || 7;
  const occupiedCount = rooms.filter(r => r.is_occupied).length;
  const vacantCount = totalRooms - occupiedCount;
  const occupancyPercent = Math.round((occupiedCount / totalRooms) * 100);

  // Floor stats
  const floor1Rooms = rooms.filter(r => r.floor_number === 1);
  const floor1Occupied = floor1Rooms.filter(r => r.is_occupied).length;
  const floor2Rooms = rooms.filter(r => r.floor_number === 2);
  const floor2Occupied = floor2Rooms.filter(r => r.is_occupied).length;

  // Financial sums
  let expectedRevenue = 0;
  let totalCollected = 0;
  let totalPending = 0;

  rooms.forEach(r => {
    if (r.current_bill) {
      expectedRevenue += Number(r.current_bill.total_payable || 0);
      totalCollected += Number(r.current_bill.amount_paid || 0);
      totalPending += Number(r.current_bill.balance_due || 0);
    } else if (r.is_occupied) {
      expectedRevenue += Number(r.base_rent || 0);
      totalPending += Number(r.base_rent || 0);
    }
  });

  const collectionRate = expectedRevenue > 0 ? Math.round((totalCollected / expectedRevenue) * 100) : 0;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Occupancy */}
        <div className="glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-cyan-400/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupancy</span>
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          
          <div className="mt-3 flex items-baseline space-x-2">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{occupiedCount} <span className="text-lg font-medium text-slate-400">/ {totalRooms}</span></h3>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {occupancyPercent}% Occupied
            </span>
          </div>

          {/* Floor breakdown pills */}
          <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" /> Floor 1: <strong className="text-slate-200">{floor1Occupied}/4</strong>
            </span>
            <span>
              Floor 2: <strong className="text-slate-200">{floor2Occupied}/3</strong>
            </span>
            <span className="text-amber-400 font-medium">{vacantCount} Vacant</span>
          </div>

          {/* Subtle Progress Track */}
          <div className="mt-3 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${occupancyPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Expected Revenue */}
        <div className="glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-blue-400/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expected Revenue</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">₹{formatINR(expectedRevenue)}</h3>
            <p className="mt-1 text-xs text-slate-400">Fixed Rent + Utilities Shared</p>
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Active Billing Cycle</span>
            <span className="text-blue-300 font-semibold">{occupiedCount} Billing Accounts</span>
          </div>
        </div>

        {/* Card 3: Total Collected */}
        <div className="glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-emerald-400/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Collected</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <h3 className="text-3xl font-extrabold text-emerald-400 tracking-tight">₹{formatINR(totalCollected)}</h3>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {collectionRate}%
            </span>
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Received via UPI/Cash</span>
            <span className="text-emerald-400 font-medium">Reconciled</span>
          </div>

          <div className="mt-3 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-teal-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${collectionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Total Pending Dues */}
        <div className="glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-rose-400/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pending Dues</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-400/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <h3 className="text-3xl font-extrabold text-rose-400 tracking-tight">₹{formatINR(totalPending)}</h3>
            {totalPending > 0 && (
              <span className="text-[11px] font-semibold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
                Action Needed
              </span>
            )}
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Includes Past Arrears</span>
            <span className="text-rose-400 font-medium">Pending Recovery</span>
          </div>
        </div>

      </div>
    </section>
  );
}
