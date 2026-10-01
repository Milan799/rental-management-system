import React, { useState, useEffect } from 'react';
import { X, UserPlus, Phone, Calendar, ShieldCheck, Home, AlertCircle, IndianRupee, User, MessageSquare } from 'lucide-react';
import { formatINR } from '../utils/whatsapp';

export default function TenantEntryModal({
  isOpen,
  onClose,
  rooms = [],
  preselectedRoom = null,
  onAddTenant
}) {
  const vacantRooms = rooms.filter(r => !r.is_occupied);

  const [roomId, setRoomId] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [moveInDate, setMoveInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [securityDeposit, setSecurityDeposit] = useState(16000);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedRoom) {
      setRoomId(preselectedRoom.room_id);
      setMonthlyRent(preselectedRoom.base_rent);
      setSecurityDeposit(preselectedRoom.base_rent * 2);
    } else if (vacantRooms.length > 0) {
      setRoomId(vacantRooms[0].room_id);
      setMonthlyRent(vacantRooms[0].base_rent);
      setSecurityDeposit(vacantRooms[0].base_rent * 2);
    }
  }, [preselectedRoom, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomId) {
      setError('Please select an available room.');
      return;
    }
    if (!fullName.trim() || !phone.trim()) {
      setError('Please enter Tenant Full Name and Contact Number.');
      return;
    }

    onAddTenant({
      roomId: Number(roomId),
      baseRent: Number(monthlyRent) || 0,
      fullName: fullName.trim(),
      phoneNumber: phone.trim(),
      whatsappNumber: (whatsapp.trim() || phone.trim()),
      moveInDate,
      securityDeposit: Number(securityDeposit || 0),
      emergencyContact: emergencyContact.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="glass-modal rounded-3xl w-full max-w-lg border border-slate-200/80 dark:border-white/20 p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:bg-cyan-500/20 dark:text-cyan-300 border border-sky-400/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Onboard New Tenant</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Assign tenant to a vacant room and record initial security deposit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Room Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Home className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" /> Select Vacant Room
            </label>
            <select
              value={roomId}
              onChange={(e) => {
                const rId = Number(e.target.value);
                setRoomId(rId);
                const selected = rooms.find(r => r.room_id === rId);
                if (selected) {
                  setMonthlyRent(selected.base_rent);
                  setSecurityDeposit(selected.base_rent * 2);
                }
              }}
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              {vacantRooms.length === 0 ? (
                <option value="" disabled>No vacant rooms available</option>
              ) : (
                vacantRooms.map(r => (
                  <option key={r.room_id} value={r.room_id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    Room {r.room_number} (Floor {r.floor_number})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Monthly Rent Editable Textbox for Room */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" /> Monthly Base Rent (₹) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={monthlyRent}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMonthlyRent(e.target.value);
                if (val > 0) setSecurityDeposit(val * 2);
              }}
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm font-extrabold text-sky-700 dark:text-cyan-300"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" /> Tenant Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-medium"
            />
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" /> Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> WhatsApp Number
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* Move-in Date & Security Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-blue-400" /> Move-in Date *
              </label>
              <input
                type="date"
                required
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Security Deposit (₹)
              </label>
              <input
                type="number"
                min="0"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-300"
              />
            </div>
          </div>

          {/* Actions */}
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
              disabled={vacantRooms.length === 0}
              className="glass-button-primary px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Complete Onboarding</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
