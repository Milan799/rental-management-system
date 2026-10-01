import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import UtilitySplitView from './components/UtilitySplitView';
import RoomsView from './components/RoomsView';
import LedgerView from './components/LedgerView';
import ReportsView from './components/ReportsView';

// Modals
import TenantEntryModal from './components/TenantEntryModal';
import EditTenantModal from './components/EditTenantModal';
import PaymentModal from './components/PaymentModal';
import VacateModal from './components/VacateModal';
import TenantLedgerModal from './components/TenantLedgerModal';

import { INITIAL_ROOMS } from './mockData';

export default function App() {
  // --- THEME STATE (LIGHT / DARK) ---
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('aerorent_theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('aerorent_theme', theme);
    } catch (e) {
      console.error('Error applying theme:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // --- AUTHENTICATION STATE ---
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('aerorent_user') || sessionStorage.getItem('aerorent_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // --- NAVIGATION TAB STATE ---
  // 'dashboard' (Main Page) | 'utilities' | 'rooms' | 'ledger' | 'reports'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [timeframe, setTimeframe] = useState('CURRENT_MONTH');

  // Dynamic Rooms Data - Clean Initial Vacant Rooms with LocalStorage Persistence
  const [rooms, setRooms] = useState(() => {
    try {
      localStorage.removeItem('aerorent_rooms');
      localStorage.removeItem('aerorent_rooms_data');
      localStorage.removeItem('aerorent_rooms_v1');
      localStorage.removeItem('aerorent_rooms_v2');

      const saved = localStorage.getItem('aerorent_rooms_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_ROOMS;
    } catch (e) {
      console.error('Error loading rooms from storage:', e);
      return INITIAL_ROOMS;
    }
  });

  // Automatically sync rooms state with LocalStorage for 100% dynamic industry-ready usage
  useEffect(() => {
    try {
      localStorage.setItem('aerorent_rooms_v3', JSON.stringify(rooms));
    } catch (e) {
      console.error('Error saving rooms to storage:', e);
    }
  }, [rooms]);

  const [isLiveApi, setIsLiveApi] = useState(false);

  // Modals state
  const [isTenantEntryOpen, setIsTenantEntryOpen] = useState(false);
  const [preselectedRoom, setPreselectedRoom] = useState(null);

  const [isEditTenantOpen, setIsEditTenantOpen] = useState(false);
  const [selectedRoomForEditTenant, setSelectedRoomForEditTenant] = useState(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedRoomForPayment, setSelectedRoomForPayment] = useState(null);

  const [isVacateOpen, setIsVacateOpen] = useState(false);
  const [selectedRoomForVacate, setSelectedRoomForVacate] = useState(null);

  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [selectedRoomForLedger, setSelectedRoomForLedger] = useState(null);

  // Check backend API connectivity
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ONLINE') {
          setIsLiveApi(true);
        }
      })
      .catch(() => {
        setIsLiveApi(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aerorent_token');
    localStorage.removeItem('aerorent_user');
    sessionStorage.removeItem('aerorent_token');
    sessionStorage.removeItem('aerorent_user');
    setUser(null);
    setActiveTab('dashboard');
  };

  // --- SIMPLE CORE LOGIC HANDLERS ---

  // 0. Update Room Monthly Base Rent via Direct Textbox
  const handleUpdateRoomRent = (roomId, newRent) => {
    const rentNum = Math.max(0, parseInt(newRent, 10) || 0);
    setRooms(prevRooms => {
      return prevRooms.map(r => {
        if (r.room_id === roomId) {
          const updated = {
            ...r,
            base_rent: rentNum
          };
          if (r.current_bill) {
            const electricity = Number(r.current_bill.electricity_share || 0) + Number(r.current_bill.prev_month_electricity_share || 0);
            const arrears = Number(r.current_bill.carried_forward_dues || 0);
            const paid = Number(r.current_bill.amount_paid || 0);
            const totalPayable = rentNum + electricity + arrears;
            const balanceDue = Math.max(0, totalPayable - paid);
            updated.current_bill = {
              ...r.current_bill,
              base_rent: rentNum,
              total_payable: totalPayable,
              balance_due: balanceDue,
              payment_status: balanceDue <= 0 ? 'PAID' : (paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID'),
              rent_status: balanceDue <= 0 ? 'PAID' : 'PENDING'
            };
          }
          return updated;
        }
        return r;
      });
    });
  };

  // 1. Day-Wise & Bi-Monthly (2-Month) Electricity & Utility Billing Calculation
  const handleGenerateBills = ({
    totalElectricity,
    dueDate,
    roomBills,
    cycleType = 'MONTHLY',
    cycleDays = 30,
    isBiMonthly = false,
    prevMonthLabel = '',
    currentMonthLabel = ''
  }) => {
    setRooms(prevRooms => {
      return prevRooms.map(r => {
        if (!r.is_occupied) return r;

        // Room-specific day-wise electricity share
        const roomBillData = roomBills ? roomBills.find(rb => rb.roomId === r.room_id) : null;
        const electricityShare = roomBillData ? Number(roomBillData.electricityShare || 0) : 0;
        const prevMonthElectricityShare = roomBillData ? Number(roomBillData.prevMonthElectricityShare || 0) : 0;
        const daysStayed = roomBillData ? Number(roomBillData.daysStayed || (isBiMonthly ? 60 : 30)) : (isBiMonthly ? 60 : 30);

        const currentArrears = r.current_bill ? Number(r.current_bill.balance_due || 0) : 0;
        const totalCurrentElectricity = electricityShare + prevMonthElectricityShare;
        const currentMonthTotal = Number(r.base_rent) + totalCurrentElectricity;
        const totalPayable = currentMonthTotal + currentArrears;

        return {
          ...r,
          current_bill: {
            id: r.current_bill ? r.current_bill.id : Math.floor(Math.random() * 10000),
            billing_month: selectedMonth,
            base_rent: Number(r.base_rent),
            electricity_share: electricityShare,
            prev_month_electricity_share: prevMonthElectricityShare,
            water_share: 0,
            maintenance_share: 0,
            days_stayed: daysStayed,
            cycle_type: cycleType,
            cycle_days: cycleDays,
            is_bimonthly: isBiMonthly,
            prev_month_label: prevMonthLabel,
            current_month_label: currentMonthLabel,
            carried_forward_dues: currentArrears,
            total_payable: totalPayable,
            amount_paid: 0,
            balance_due: totalPayable,
            rent_status: 'PENDING',
            electricity_status: totalCurrentElectricity > 0 ? 'PENDING' : 'PAID',
            water_status: 'PAID',
            payment_status: 'UNPAID',
            due_date: dueDate
          }
        };
      });
    });
  };

  // 2. Onboard Tenant into Vacant Room (with custom base rent)
  const handleAddTenant = (tenantData) => {
    setRooms(prevRooms => {
      return prevRooms.map(r => {
        if (r.room_id === tenantData.roomId) {
          const finalBaseRent = tenantData.baseRent !== undefined && tenantData.baseRent !== null && !isNaN(tenantData.baseRent)
            ? Number(tenantData.baseRent)
            : Number(r.base_rent);

          return {
            ...r,
            base_rent: finalBaseRent,
            is_occupied: true,
            tenant: {
              id: Math.floor(Math.random() * 10000),
              full_name: tenantData.fullName,
              phone_number: tenantData.phoneNumber,
              whatsapp_number: tenantData.whatsappNumber,
              move_in_date: tenantData.moveInDate,
              security_deposit: tenantData.securityDeposit
            },
            current_bill: {
              id: Math.floor(Math.random() * 10000),
              billing_month: selectedMonth,
              base_rent: finalBaseRent,
              electricity_share: 0,
              water_share: 0,
              maintenance_share: 0,
              carried_forward_dues: 0,
              total_payable: finalBaseRent,
              amount_paid: 0,
              balance_due: finalBaseRent,
              rent_status: 'PENDING',
              electricity_status: 'PAID',
              water_status: 'PAID',
              payment_status: 'UNPAID',
              due_date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0]
            }
          };
        }
        return r;
      });
    });
  };

  // 2.5 Update Existing Tenant Details (Full Name, Phone, Deposit, Rent, etc.)
  const handleUpdateTenant = (tenantData) => {
    setRooms(prevRooms => {
      return prevRooms.map(r => {
        if (r.room_id === tenantData.roomId) {
          const finalBaseRent = tenantData.baseRent !== undefined && tenantData.baseRent !== null && !isNaN(tenantData.baseRent)
            ? Number(tenantData.baseRent)
            : Number(r.base_rent);

          const updatedTenant = {
            ...(r.tenant || {}),
            id: tenantData.tenantId || r.tenant?.id,
            full_name: tenantData.fullName,
            phone_number: tenantData.phoneNumber,
            whatsapp_number: tenantData.whatsappNumber,
            move_in_date: tenantData.moveInDate,
            security_deposit: tenantData.securityDeposit,
            emergency_contact: tenantData.emergencyContact
          };

          const updated = {
            ...r,
            base_rent: finalBaseRent,
            tenant: updatedTenant
          };

          if (r.current_bill) {
            const electricity = Number(r.current_bill.electricity_share || 0) + Number(r.current_bill.prev_month_electricity_share || 0);
            const arrears = Number(r.current_bill.carried_forward_dues || 0);
            const paid = Number(r.current_bill.amount_paid || 0);
            const totalPayable = finalBaseRent + electricity + arrears;
            const balanceDue = Math.max(0, totalPayable - paid);

            updated.current_bill = {
              ...r.current_bill,
              base_rent: finalBaseRent,
              total_payable: totalPayable,
              balance_due: balanceDue,
              payment_status: balanceDue <= 0 ? 'PAID' : (paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID'),
              rent_status: balanceDue <= 0 ? 'PAID' : 'PENDING'
            };
          }

          return updated;
        }
        return r;
      });
    });
  };

  // 3. Record Payment
  const handleRecordPayment = ({ roomId, amountPaid }) => {
    setRooms(prevRooms => {
      return prevRooms.map(r => {
        if (r.room_id === roomId && r.current_bill) {
          const newPaid = Number(r.current_bill.amount_paid) + Number(amountPaid);
          const newBalance = Number(r.current_bill.total_payable) - newPaid;
          const isPaid = newBalance <= 0;

          return {
            ...r,
            current_bill: {
              ...r.current_bill,
              amount_paid: newPaid,
              balance_due: Math.max(0, newBalance),
              payment_status: isPaid ? 'PAID' : 'PARTIALLY_PAID',
              rent_status: isPaid ? 'PAID' : r.current_bill.rent_status,
              electricity_status: isPaid ? 'PAID' : r.current_bill.electricity_status,
              water_status: isPaid ? 'PAID' : r.current_bill.water_status
            }
          };
        }
        return r;
      });
    });
  };

  // 4. Vacate & Settle Tenant
  const handleFinalizeSettlement = ({ roomId }) => {
    setRooms(prevRooms => {
      return prevRooms.map(r => {
        if (r.room_id === roomId) {
          return {
            ...r,
            is_occupied: false,
            tenant: null,
            current_bill: null
          };
        }
        return r;
      });
    });
  };

  // --- 1. IF NOT LOGGED IN, RENDER SECURE LOGIN PAGE ---
  if (!user) {
    return (
      <LoginPage 
        onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // --- 2. LOGGED IN DASHBOARD SUITE ---
  return (
    <div className="min-h-screen pb-24 lg:pb-16">
      
      {/* Apple-grade Glassmorphic Navbar with Page Links */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main View Router with Smooth Page Transition */}
      <main key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out pt-2 sm:pt-4">
        
        {/* TAB 1: MAIN PAGE (DASHBOARD ONLY) */}
        {activeTab === 'dashboard' && (
          <DashboardView
            rooms={rooms}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            setActiveTab={setActiveTab}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
          />
        )}

        {/* TAB 2: UTILITY SPLIT (AUTOMATION CORE) */}
        {activeTab === 'utilities' && (
          <UtilitySplitView
            rooms={rooms}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            setActiveTab={setActiveTab}
            onGenerateBills={handleGenerateBills}
          />
        )}

        {/* TAB 3: 7 ROOMS & TENANTS (2 FLOORS) */}
        {activeTab === 'rooms' && (
          <RoomsView
            rooms={rooms}
            selectedMonth={selectedMonth}
            onUpdateRent={handleUpdateRoomRent}
            onOpenTenantEntry={(room) => {
              setPreselectedRoom(room);
              setIsTenantEntryOpen(true);
            }}
            onOpenEditTenant={(room) => {
              setSelectedRoomForEditTenant(room);
              setIsEditTenantOpen(true);
            }}
            onOpenPayment={(room) => {
              setSelectedRoomForPayment(room);
              setIsPaymentOpen(true);
            }}
            onOpenVacate={(room) => {
              setSelectedRoomForVacate(room);
              setIsVacateOpen(true);
            }}
            onOpenLedger={(room) => {
              setSelectedRoomForLedger(room);
              setIsLedgerOpen(true);
            }}
          />
        )}

        {/* TAB 4: LEDGER & DUES */}
        {activeTab === 'ledger' && (
          <LedgerView
            rooms={rooms}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            setActiveTab={setActiveTab}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            onOpenPayment={(room) => {
              setSelectedRoomForPayment(room);
              setIsPaymentOpen(true);
            }}
            onOpenVacate={(room) => {
              setSelectedRoomForVacate(room);
              setIsVacateOpen(true);
            }}
            onOpenLedger={(room) => {
              setSelectedRoomForLedger(room);
              setIsLedgerOpen(true);
            }}
          />
        )}

        {/* TAB 5: REPORTS & EXPORT */}
        {activeTab === 'reports' && (
          <ReportsView
            rooms={rooms}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
          />
        )}

      </main>

      {/* Global Modals for Quick Interaction */}
      <TenantEntryModal
        isOpen={isTenantEntryOpen}
        onClose={() => setIsTenantEntryOpen(false)}
        rooms={rooms}
        preselectedRoom={preselectedRoom}
        onAddTenant={handleAddTenant}
      />

      <EditTenantModal
        isOpen={isEditTenantOpen}
        onClose={() => setIsEditTenantOpen(false)}
        room={selectedRoomForEditTenant}
        onUpdateTenant={handleUpdateTenant}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        room={selectedRoomForPayment}
        onRecordPayment={handleRecordPayment}
      />

      <VacateModal
        isOpen={isVacateOpen}
        onClose={() => setIsVacateOpen(false)}
        room={selectedRoomForVacate}
        onFinalizeSettlement={handleFinalizeSettlement}
      />

      <TenantLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        room={selectedRoomForLedger}
      />

    </div>
  );
}
