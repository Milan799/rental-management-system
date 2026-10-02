import React, { createContext, useContext, useState, useEffect } from 'react';

// English and Gujarati Translation Dictionary
export const translations = {
  en: {
    // Navbar & Global
    nav_dashboard: 'Dashboard',
    nav_utilities: 'Utility Split',
    nav_rooms: 'Rooms & Tenants',
    nav_ledger: 'Ledger & Dues',
    nav_reports: 'Reports',
    sign_out: 'Sign Out',
    admin_profile: 'Admin Profile',
    property_manager: 'Property Manager',
    cloud_live: 'Cloud Live',
    cloud_syncing: 'Syncing...',
    cloud_reconnect: 'Sync Cloud',
    local_mode: 'Local Mode',
    theme_light: 'Light',
    theme_dark: 'Dark',

    // Language Selector
    language: 'Language',
    select_language: 'Select Language',
    english: 'English',
    gujarati: 'ગુજરાતી',

    // Dashboard View & Stats
    property_dashboard: 'Property Dashboard',
    dashboard_subtitle: 'Overview of occupancy, collections & revenue tracking',
    occupancy: 'Occupancy',
    expected_revenue: 'Expected Revenue',
    total_collected: 'Total Collected',
    pending_dues: 'Pending Dues',
    collection_rate: 'Collection Rate',
    billing_target: 'Billing Target',
    accounts: 'Accounts',
    rent: 'Rent',
    electricity: 'Electricity',
    floor: 'Floor',
    floor_1: 'Floor 1',
    floor_2: 'Floor 2',
    vacant: 'Vacant',
    occupied: 'Occupied',
    rooms_count: '7 Rooms (2 Floors)',
    quick_actions: 'Quick Actions',
    add_tenant: 'Add New Tenant',
    record_payment: 'Record Rent Payment',
    split_bills: 'Split Utility Bills',
    view_ledger: 'View Ledger & Dues',
    export_data: 'Export Reports',

    // Rooms & Tenants
    room: 'Room',
    rooms_and_tenants: 'Rooms & Tenants',
    tenant_details: 'Tenant Details',
    edit_tenant: 'Edit Tenant',
    vacate_room: 'Vacate Room',
    view_ledger_btn: 'Ledger',
    whatsapp_reminder: 'Send WhatsApp Reminder',
    full_name: 'Full Name',
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    deposit: 'Security Deposit',
    base_rent: 'Base Rent',
    move_in_date: 'Move-in Date',
    status: 'Status',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partially_paid: 'Partially Paid',
    balance_due: 'Balance Due',
    total_payable: 'Total Payable',

    // Notifications Center
    notifications: 'Notifications',
    new_badge: 'new',
    all_caught_up: 'All caught up!',
    no_alerts_category: 'No active alerts for this category.',
    notification_controls: 'Notification Controls',
    saved_locally: 'Saved locally',
    enable_in_app: 'Enable In-App Alerts',
    audio_chimes: 'Audio Chimes',
    rent_due_reminders: 'Rent Due Reminders',
    cloud_sync_alerts: 'TiDB Cloud Sync Alerts',
    filter_all: 'All',
    filter_dues: 'Dues',
    filter_activity: 'Activity',
    clear_all: 'Clear All',
    mark_all_read: 'Mark all as read',
    collect_rent: 'Collect Rent',
    just_now: 'Just now',

    // Actions & Buttons
    save: 'Save Details',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    submit: 'Submit'
  },

  gu: {
    // Navbar & Global (ગુજરાતી)
    nav_dashboard: 'ડેશબોર્ડ',
    nav_utilities: 'લાઇટ-પાણી બિલ',
    nav_rooms: 'રૂમ અને ભાડૂઆત',
    nav_ledger: 'ખાતાવહી અને બાકી',
    nav_reports: 'રિપોર્ટ્સ',
    sign_out: 'સાઇન આઉટ',
    admin_profile: 'એડમિન પ્રોફાઇલ',
    property_manager: 'પ્રોપર્ટી મેનેજર',
    cloud_live: 'ક્લાઉડ લાઇવ',
    cloud_syncing: 'સિંક થઈ રહ્યું છે...',
    cloud_reconnect: 'ક્લાઉડ સમન્વય',
    local_mode: 'લોકલ મોડ',
    theme_light: 'લાઈટ',
    theme_dark: 'ડાર્ક',

    // Language Selector (ગુજરાતી)
    language: 'ભાષા (Language)',
    select_language: 'ભાષા પસંદ કરો',
    english: 'English',
    gujarati: 'ગુજરાતી',

    // Dashboard View & Stats (ગુજરાતી)
    property_dashboard: 'પ્રોપર્ટી ડેશબોર્ડ',
    dashboard_subtitle: 'રોકાયેલ રૂમ, વસૂલાત અને આવકનો સંપૂર્ણ હિસાબ',
    occupancy: 'રૂમ રોકાણ દર',
    expected_revenue: 'અપેક્ષિત આવક',
    total_collected: 'કુલ વસૂલાત',
    pending_dues: 'કુલ બાકી રકમ',
    collection_rate: 'વસૂલાત ટકાવારી',
    billing_target: 'બિલિંગ લક્ષ્યાંક',
    accounts: 'ખાતાઓ',
    rent: 'ભાડું',
    electricity: 'વીજળી બિલ',
    floor: 'માળ',
    floor_1: 'પહેલો માળ',
    floor_2: 'બીજો માળ',
    vacant: 'ખાલી',
    occupied: 'ભરેલ (રોકાયેલ)',
    rooms_count: '૭ રૂમ (૨ માળ)',
    quick_actions: 'ઝડપી કાર્યો',
    add_tenant: 'નવો ભાડૂઆત ઉમેરો',
    record_payment: 'ભાડું / ચુકવણી નોંધો',
    split_bills: 'લાઇટ-પાણી બિલ વહેંચો',
    view_ledger: 'ખાતાવહી અને બાકી જુઓ',
    export_data: 'રિપોર્ટ નિકાસ કરો',

    // Rooms & Tenants (ગુજરાતી)
    room: 'રૂમ',
    rooms_and_tenants: 'રૂમ અને ભાડૂઆતો',
    tenant_details: 'ભાડૂઆતની વિગતો',
    edit_tenant: 'વિગતો સુધારો',
    vacate_room: 'રૂમ ખાલી કરો',
    view_ledger_btn: 'ખાતાવહી',
    whatsapp_reminder: 'WhatsApp મેસેજ મોકલો',
    full_name: 'પૂરું નામ',
    phone: 'મોબાઇલ નંબર',
    whatsapp: 'વોટ્સએપ નંબર',
    deposit: 'ડિપોઝિટ (અનામત)',
    base_rent: 'માસિક ભાડું',
    move_in_date: 'દાખલ તારીખ',
    status: 'સ્થિતિ',
    paid: 'ચૂકવેલ',
    unpaid: 'બાકી',
    partially_paid: 'અંશતઃ ચૂકવેલ',
    balance_due: 'બાકી રકમ',
    total_payable: 'કુલ ચૂકવવાપાત્ર',

    // Notifications Center (ગુજરાતી)
    notifications: 'નોટિફિકેશન્સ (સૂચનાઓ)',
    new_badge: 'નવા',
    all_caught_up: 'બધું અપ-ટૂ-ડેટ છે! 🎉',
    no_alerts_category: 'આ શ્રેણી માટે કોઈ પેન્ડિંગ એલર્ટ નથી.',
    notification_controls: 'નોટિફિકેશન સેટિંગ્સ',
    saved_locally: 'લોકલ સેવ થયેલ',
    enable_in_app: 'એપમાં સૂચનાઓ ચાલુ રાખો',
    audio_chimes: 'અવાજ / ઘંટડી (Chimes)',
    rent_due_reminders: 'બાકી ભાડાની યાદ અપાવો',
    cloud_sync_alerts: 'TiDB ક્લાઉડ સિંક એલર્ટ',
    filter_all: 'બધા',
    filter_dues: 'બાકી રકમ',
    filter_activity: 'પ્રવૃત્તિ',
    clear_all: 'બધું સાફ કરો',
    mark_all_read: 'બધા વંચાઈ ગયા',
    collect_rent: 'ભાડું વસૂલો',
    just_now: 'હમણાં જ',

    // Actions & Buttons (ગુજરાતી)
    save: 'વિગતો સાચવો',
    cancel: 'રદ કરો',
    confirm: 'ખાતરી કરો',
    close: 'બંધ કરો',
    submit: 'સબમિટ કરો'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // State initialized from localStorage ('en' or 'gu')
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('aerorent_language');
      if (saved === 'gu' || saved === 'en') return saved;
    } catch (e) {
      console.warn('Error reading language from localStorage:', e);
    }
    return 'en';
  });

  const setLanguage = (lang) => {
    if (lang !== 'en' && lang !== 'gu') return;
    setLanguageState(lang);
    try {
      localStorage.setItem('aerorent_language', lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.error('Error persisting language:', e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'gu' : 'en');
  };

  // Translation helper function
  const t = (key, fallback = '') => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {}
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Safe fallback if used outside LanguageProvider
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key, fallback = '') => fallback || key
    };
  }
  return context;
}
