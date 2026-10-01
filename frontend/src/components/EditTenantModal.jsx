import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  User, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Home, 
  AlertCircle, 
  IndianRupee, 
  MessageSquare,
  Check,
  PhoneCall
} from 'lucide-react';
import { formatINR } from '../utils/whatsapp';

export default function EditTenantModal({
  isOpen,
  onClose,
  room,
  onUpdateTenant
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [baseRent, setBaseRent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (room && room.tenant) {
      const t = room.tenant;
      setFullName(t.full_name || '');
      setPhone(t.phone_number || '');
      setWhatsapp(t.whatsapp_number || t.phone_number || '');
      setMoveInDate(t.move_in_date ? t.move_in_date.split('T')[0] : '');
      setSecurityDeposit(t.security_deposit !== undefined ? t.security_deposit : '');
      setEmergencyContact(t.emergency_contact || '');
      setBaseRent(room.base_rent !== undefined ? room.base_rent : '');
      setError('');
    }
  }, [room, isOpen]);

  if (!isOpen || !room || !room.tenant) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter tenant full name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter contact phone number.');
      return;
    }

    onUpdateTenant({
      roomId: room.room_id,
      tenantId: room.tenant.id,
      fullName: fullName.trim(),
      phoneNumber: phone.trim(),
      whatsappNumber: whatsapp.trim() || phone.trim(),
      moveInDate: moveInDate || new Date().toISOString().split('T')[0],
      securityDeposit: Number(securityDeposit || 0),
      emergencyContact: emergencyContact.trim(),
      baseRent: Number(baseRent || 0)
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="glass-modal rounded-3xl w-full max-w-lg border border-slate-200/80 dark:border-white/20 p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:bg-cyan-500/20 dark:text-cyan-300 border border-sky-400/30 flex items-center justify-center shadow-sm">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Edit Tenant Details
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Home className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                Room {room.room_number} • Floor {room.floor_number}
              </p>
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Tenant Full Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" /> 
              Tenant Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm font-medium"
            />
          </div>

          {/* Contact Numbers (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" /> 
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm font-medium"
              />
            </div>
          </div>

          {/* Move-in Date & Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> 
                Move-in Date
              </label>
              <input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> 
                Emergency Contact
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm font-medium"
              />
            </div>
          </div>

          {/* Financials: Room Rent & Security Deposit */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              FINANCIAL DETAILS
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" /> 
                  Monthly Room Rent (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={baseRent}
                  onChange={(e) => setBaseRent(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm font-bold text-sky-700 dark:text-cyan-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              <span>Save Changes</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

