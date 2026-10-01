import React from 'react';
import { Building2, UserPlus } from 'lucide-react';
import RoomFloorGrid from './RoomFloorGrid';

export default function RoomsView({
  rooms = [],
  selectedMonth,
  onUpdateRent,
  onOpenTenantEntry,
  onOpenEditTenant,
  onOpenLedger,
  onOpenPayment,
  onOpenVacate
}) {
  return (
    <div className="space-y-4">
      <RoomFloorGrid
        rooms={rooms}
        selectedMonth={selectedMonth}
        onUpdateRent={onUpdateRent}
        onOpenTenantEntry={onOpenTenantEntry}
        onOpenEditTenant={onOpenEditTenant}
        onOpenLedger={onOpenLedger}
        onOpenPayment={onOpenPayment}
        onOpenVacate={onOpenVacate}
      />
    </div>
  );
}
