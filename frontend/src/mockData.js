/**
 * Clean Industry-Ready 7 Rooms across 2 Floors
 * Starts clean with zero pre-filled tenants or fake data.
 * Ready for live landlord usage with 100% dynamic data entry.
 */

export const INITIAL_ROOMS = [
  // 1st Floor (4 Rooms: 101 to 104)
  {
    room_id: 1,
    room_number: '101',
    floor_number: 1,
    base_rent: 8000,
    is_occupied: false,
    description: 'Floor 1 Room 101',
    tenant: null,
    current_bill: null
  },
  {
    room_id: 2,
    room_number: '102',
    floor_number: 1,
    base_rent: 7500,
    is_occupied: false,
    description: 'Floor 1 Room 102',
    tenant: null,
    current_bill: null
  },
  {
    room_id: 3,
    room_number: '103',
    floor_number: 1,
    base_rent: 8500,
    is_occupied: false,
    description: 'Floor 1 Room 103',
    tenant: null,
    current_bill: null
  },
  {
    room_id: 4,
    room_number: '104',
    floor_number: 1,
    base_rent: 7500,
    is_occupied: false,
    description: 'Floor 1 Room 104',
    tenant: null,
    current_bill: null
  },
  // 2nd Floor (3 Rooms: 201 to 203)
  {
    room_id: 5,
    room_number: '201',
    floor_number: 2,
    base_rent: 9000,
    is_occupied: false,
    description: 'Floor 2 Room 201',
    tenant: null,
    current_bill: null
  },
  {
    room_id: 6,
    room_number: '202',
    floor_number: 2,
    base_rent: 8500,
    is_occupied: false,
    description: 'Floor 2 Room 202',
    tenant: null,
    current_bill: null
  },
  {
    room_id: 7,
    room_number: '203',
    floor_number: 2,
    base_rent: 8000,
    is_occupied: false,
    description: 'Floor 2 Room 203',
    tenant: null,
    current_bill: null
  }
];
