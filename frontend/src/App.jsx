import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Notifications System
import ToastContainer from './components/ToastContainer';
import { playNotificationSound, playSuccessSound } from './utils/soundEffects';

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

  // --- NOTIFICATION PREFERENCES & TOGGLES ---
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('aerorent_notification_prefs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { enabled: true, sound: true, duesAlerts: true, cloudAlerts: true };
  });

  useEffect(() => {
    try {
      localStorage.setItem('aerorent_notification_prefs', JSON.stringify(notificationPrefs));
    } catch (e) {
      console.error('Error saving notification prefs:', e);
    }
  }, [notificationPrefs]);

  // Notifications History List
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('aerorent_notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('aerorent_notifications', JSON.stringify(notifications.slice(0, 40)));
    } catch (e) {
      console.error('Error saving notifications:', e);
    }
  }, [notifications]);

  // Active Toast Alerts List
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Central Notification Trigger
  const triggerNotification = useCallback(({ type, title, message, action = null, duration = 4000 }) => {
    const newId = 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newNotification = {
      id: newId,
      type,
      title,
      message,
      timestamp: nowStr,
      read: false,
      action
    };

    // Add to history
    setNotifications(prev => [newNotification, ...prev]);

    // Check if user has toggled notifications ON
    if (notificationPrefs.enabled) {
      // Check feature-specific toggles
      if (type === 'cloud' && !notificationPrefs.cloudAlerts) return;
      if ((type === 'due' || type === 'alert') && !notificationPrefs.duesAlerts) return;

      // Add to floating toasts
      setToasts(prev => [...prev.slice(-3), { id: newId, type, title, message, duration }]);

      // Audio chime if sound is enabled
      if (notificationPrefs.sound) {
        if (type === 'payment' || type === 'success') {
          playSuccessSound();
        } else {
          playNotificationSound();
        }
      }
    }
  }, [notificationPrefs]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleDismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- CLOUD SYNC & TIDB MYSQL DATABASE INTEGRATION ---
  const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || (import.meta.env.DEV ? '/api' : 'https://rental-management-system-yjfg.onrender.com/api');
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const isInitializedRef = useRef(false);

  // 1. Initial Cloud Sync on Mount from TiDB Cloud MySQL
  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        setIsCloudSyncing(true);
        const res = await fetch(API_BASE_URL + '/sync');
        if (!res.ok) throw new Error('Cloud sync endpoint unreachable');
        const data = await res.json();
        if (data.success && Array.isArray(data.rooms) && data.rooms.length > 0) {
          console.log('⚡ Loaded latest state from Cloud MySQL:', data.rooms.length, 'rooms');
          setRooms(data.rooms);
          setIsLiveApi(true);

          if (notificationPrefs.cloudAlerts) {
            triggerNotification({
              type: 'cloud',
              title: 'TiDB Cloud Synced',
              message: `Connected & loaded ${data.rooms.length} rooms from live cloud database.`,
              duration: 3500
            });
          }
        }
      } catch (err) {
        console.warn('Working in LocalStorage mode (Cloud offline):', err.message);
        setIsLiveApi(false);
      } finally {
        setIsCloudSyncing(false);
        isInitializedRef.current = true;
      }
    };

    fetchCloudData();
  }, []);

  // 2. Automatically sync rooms state with LocalStorage AND Cloud MySQL
  useEffect(() => {
    try {
      localStorage.setItem('aerorent_rooms_v3', JSON.stringify(rooms));
    } catch (e) {
      console.error('Error saving rooms to storage:', e);
    }

    if (isInitializedRef.current) {
      const timer = setTimeout(async () => {
        try {
          setIsCloudSyncing(true);
          const res = await fetch(API_BASE_URL + '/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rooms })
          });
          if (res.ok) {
            setIsLiveApi(true);
          }
        } catch (syncErr) {
          console.warn('Cloud sync deferred (saved locally):', syncErr.message);
        } finally {
          setIsCloudSyncing(false);
        }
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [rooms]);

  // 3. Dynamic Rent Due Scanner: Synchronize pending dues into notification center
  useEffect(() => {
    if (!rooms || rooms.length === 0) return;

    const dueRooms = rooms.filter(r => 
      r.is_occupied && 
      r.tenant && 
      r.current_bill && 
      Number(r.current_bill.balance_due || 0) > 0 && 
      r.current_bill.payment_status !== 'PAID'
    );

    if (dueRooms.length > 0) {
      setNotifications(prev => {
        const nonDues = prev.filter(n => !n.id.startsWith('due-room-'));
        const readMap = new Map(prev.filter(n => n.read).map(n => [n.id, true]));

        const newDues = dueRooms.map(r => ({
          id: `due-room-${r.room_id}`,
          type: 'due',
          title: `Rent Due: Room ${r.room_number}`,
          message: `${r.tenant.full_name} has ₹${Number(r.current_bill.balance_due).toLocaleString('en-IN')} pending balance for ${selectedMonth}.`,
          timestamp: 'Due Alert',
          read: readMap.has(`due-room-${r.room_id}`) || false,
          roomId: r.room_id,
          action: {
            label: 'Collect Rent',
            onClick: () => {
              setSelectedRoomForPayment(r);
              setIsPaymentOpen(true);
            }
          }
        }));

        return [...newDues, ...nonDues];
      });
    }
  }, [rooms, selectedMonth]);

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

  // Authentication logout
  const handleLogout = () => {
    localStorage.removeItem('aerorent_user');
    sessionStorage.removeItem('aerorent_user');
    setUser(null);
  };

  // --- BUSINESS ACTION HANDLERS WITH NOTIFICATION TRIGGERS ---

  // 1. Utility Split Bill Generation
  const handleGenerateBills = (generatedBills) => {
    setRooms(prevRooms => {
      return prevRooms.map(room => {
        const updatedBill = generatedBills.find(b => b.room_id === room.room_id);
        if (updatedBill) {
          return {
            ...room,
            current_bill: updatedBill
          };
        }
        return room;
      });
    });

    triggerNotification({
      type: 'utility',
      title: 'Utility Bills Generated',
      message: `Utility split & electricity shares calculated for ${selectedMonth}.`,
      duration: 4500
    });
  };

  // 2. Room Rent Override
  const handleUpdateRoomRent = (roomId, newRent) => {
    setRooms(prevRooms => {
      return prevRooms.map(r => {
        if (r.room_id === roomId) {
          const updated = { ...r, base_rent: Number(newRent) };
          if (r.current_bill) {
            const electricity = Number(r.current_bill.electricity_share || 0) + Number(r.current_bill.prev_month_electricity_share || 0);
            const arrears = Number(r.current_bill.carried_forward_dues || 0);
            const paid = Number(r.current_bill.amount_paid || 0);
            const totalPayable = Number(newRent) + electricity + arrears;
            const balanceDue = Math.max(0, totalPayable - paid);

            updated.current_bill = {
              ...r.current_bill,
              base_rent: Number(newRent),
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

    triggerNotification({
      type: 'info',
      title: 'Base Rent Updated',
      message: `Room ${roomId} base rent updated to ₹${Number(newRent).toLocaleString('en-IN')}`,
      duration: 3500
    });
  };

  // 2.1 Add New Tenant
  const handleAddTenant = (tenantData) => {
    const targetRoomId = tenantData.roomId || preselectedRoom?.room_id;
    let assignedRoomNumber = targetRoomId;

    setRooms(prevRooms => {
      return prevRooms.map(r => {
        if (r.room_id === targetRoomId) {
          assignedRoomNumber = r.room_number;
          const assignedRent = tenantData.baseRent ? Number(tenantData.baseRent) : Number(r.base_rent);
          return {
            ...r,
            is_occupied: true,
            base_rent: assignedRent,
            tenant: {
              id: Date.now(),
              full_name: tenantData.fullName,
              phone_number: tenantData.phoneNumber,
              whatsapp_number: tenantData.whatsappNumber,
              move_in_date: tenantData.moveInDate,
              security_deposit: tenantData.securityDeposit,
              emergency_contact: tenantData.emergencyContact
            },
            current_bill: {
              bill_id: Date.now() + 1,
              billing_month: selectedMonth,
              base_rent: assignedRent,
              electricity_share: 0,
              water_share: 0,
              carried_forward_dues: 0,
              total_payable: assignedRent,
              amount_paid: 0,
              balance_due: assignedRent,
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

    triggerNotification({
      type: 'success',
      title: '🎉 New Tenant Registered',
      message: `${tenantData.fullName} moved into Room ${assignedRoomNumber}.`,
      duration: 5000
    });
  };

  // 2.5 Update Existing Tenant Details
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

    triggerNotification({
      type: 'info',
      title: '✏️ Tenant Profile Updated',
      message: `Profile & rent details updated for Room ${tenantData.roomId}.`,
      duration: 4000
    });
  };

  // 3. Record Payment
  const handleRecordPayment = ({ roomId, amountPaid }) => {
    let targetRoomNumber = roomId;

    setRooms(prevRooms => {
      return prevRooms.map(r => {
        if (r.room_id === roomId && r.current_bill) {
          targetRoomNumber = r.room_number;
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

    triggerNotification({
      type: 'payment',
      title: '💵 Payment Recorded',
      message: `₹${Number(amountPaid).toLocaleString('en-IN')} payment received for Room ${targetRoomNumber}.`,
      duration: 5000
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

    triggerNotification({
      type: 'info',
      title: '🚪 Room Vacated & Settled',
      message: `Room ${roomId} has been vacated and marked ready for new tenant.`,
      duration: 4500
    });
  };

  // Notification action router
  const handleNotificationAction = (item) => {
    if (item.action && typeof item.action.onClick === 'function') {
      item.action.onClick();
      return;
    }
    if (item.roomId) {
      const room = rooms.find(r => r.room_id === item.roomId);
      if (room) {
        setSelectedRoomForPayment(room);
        setIsPaymentOpen(true);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
      
      {/* Realtime Toast Notifications Floating System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Apple-grade Glassmorphic Navbar with Page Links & Notification Center */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
        isLiveApi={isLiveApi}
        isCloudSyncing={isCloudSyncing}
        notifications={notifications}
        unreadCount={unreadCount}
        notificationPrefs={notificationPrefs}
        onUpdateNotificationPrefs={setNotificationPrefs}
        onMarkAllRead={handleMarkAllRead}
        onClearAllNotifications={handleClearAllNotifications}
        onDismissNotification={handleDismissNotification}
        onNotificationAction={handleNotificationAction}
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
