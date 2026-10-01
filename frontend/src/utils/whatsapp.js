/**
 * Messaging & Reminders Helper (WhatsApp & SMS)
 * Generates clean Hindi invoice reminders with universal UTF-8 bullet points
 * Eliminates broken emojis/question mark () symbols.
 * Supports both Monthly (30 Days) and Bi-Monthly (2 Months / 60 Days / 50-50 Split) cycles.
 */

export function formatINR(val) {
  return Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
}

export function sanitizePhone(phone, defaultCountryCode = '91') {
  if (!phone) return '';
  const digits = phone.toString().replace(/\D/g, '');
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }
  return digits;
}

export function getPreviousMonthStr(monthStr) {
  if (!monthStr) return '';
  try {
    const [year, month] = monthStr.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    return `${prevYear}-${prevMonth}`;
  } catch {
    return '';
  }
}

export function getMonthDisplayName(monthStr) {
  if (!monthStr) return '';
  try {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  } catch {
    return monthStr;
  }
}

// --- TIMEFRAME CONSTANTS & HELPERS ---
export const TIMEFRAMES = {
  CURRENT_MONTH: { id: 'CURRENT_MONTH', label: 'Current Month', shortLabel: 'This Month', mobileLabel: 'This Month', count: 1 },
  LAST_3_MONTHS: { id: 'LAST_3_MONTHS', label: 'Last 3 Months', shortLabel: '3 Months', mobileLabel: '3 Months', count: 3 },
  LAST_6_MONTHS: { id: 'LAST_6_MONTHS', label: 'Last 6 Months', shortLabel: '6 Months', mobileLabel: '6 Months', count: 6 },
  LAST_YEAR: { id: 'LAST_YEAR', label: 'Last Year', shortLabel: '1 Year', mobileLabel: '1 Year', count: 12 },
};

export const TIMEFRAME_OPTIONS = [
  TIMEFRAMES.CURRENT_MONTH,
  TIMEFRAMES.LAST_3_MONTHS,
  TIMEFRAMES.LAST_6_MONTHS,
  TIMEFRAMES.LAST_YEAR
];

export function getTimeframeInfo(timeframeId = 'CURRENT_MONTH', selectedMonth = '2026-10') {
  const tf = TIMEFRAMES[timeframeId] || TIMEFRAMES.CURRENT_MONTH;
  const count = tf.count;

  if (count === 1) {
    const monthName = getMonthDisplayName(selectedMonth);
    return {
      ...tf,
      periodLabel: monthName,
      shortPeriodLabel: monthName,
      count: 1
    };
  }

  try {
    const [year, month] = selectedMonth.split('-').map(Number);
    const endDate = new Date(year, month - 1, 1);
    const startDate = new Date(year, month - 1 - (count - 1), 1);

    const endStr = endDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    const startStr = startDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    return {
      ...tf,
      periodLabel: `${startStr} – ${endStr} (${count} Months)`,
      shortPeriodLabel: `${startStr} – ${endStr}`,
      count
    };
  } catch {
    return {
      ...tf,
      periodLabel: `${tf.label} (${count} Months)`,
      shortPeriodLabel: tf.label,
      count
    };
  }
}

/**
 * Calculates live financial figures for a room based on the chosen timeframe filter
 * (Current Month, Last 3 Months, Last 6 Months, Last Year)
 */
export function calculateRoomPeriodFigures(room, timeframeId = 'CURRENT_MONTH') {
  const tf = TIMEFRAMES[timeframeId] || TIMEFRAMES.CURRENT_MONTH;
  const count = tf.count;
  const baseRent = Number(room?.base_rent || 0);

  if (!room || !room.is_occupied) {
    return {
      fixedRent: baseRent * count,
      electricity: 0,
      totalPayable: 0,
      amountPaid: 0,
      balanceDue: 0,
      status: 'VACANT',
      count
    };
  }

  const bill = room.current_bill;
  const monthlyElectricity = bill
    ? (Number(bill.electricity_share || 0) + Number(bill.prev_month_electricity_share || 0))
    : 0;
  const carriedArrears = bill ? Number(bill.carried_forward_dues || 0) : 0;
  const currentPaid = bill ? Number(bill.amount_paid || 0) : 0;

  // Single Month (Current Month)
  if (count === 1) {
    const totalPayable = bill ? Number(bill.total_payable || 0) : baseRent;
    const balanceDue = bill ? Number(bill.balance_due || 0) : baseRent;
    const status = bill ? bill.payment_status : 'UNPAID';
    return {
      fixedRent: baseRent,
      electricity: monthlyElectricity,
      totalPayable,
      amountPaid: currentPaid,
      balanceDue,
      status,
      count: 1
    };
  }

  // Multi-Month Aggregation (3 Months, 6 Months, 12 Months)
  const periodFixedRent = baseRent * count;
  const periodElectricity = monthlyElectricity * count;
  const periodTotalPayable = periodFixedRent + periodElectricity + carriedArrears;

  // Past (count - 1) months were paid, current month has currentPaid:
  const pastMonthsPaid = (baseRent + monthlyElectricity) * (count - 1);
  const periodAmountPaid = pastMonthsPaid + currentPaid;
  const periodBalanceDue = Math.max(0, periodTotalPayable - periodAmountPaid);

  let periodStatus = 'UNPAID';
  if (periodBalanceDue <= 0) {
    periodStatus = 'PAID';
  } else if (periodAmountPaid > 0) {
    periodStatus = 'PARTIALLY_PAID';
  }

  return {
    fixedRent: periodFixedRent,
    electricity: periodElectricity,
    totalPayable: periodTotalPayable,
    amountPaid: periodAmountPaid,
    balanceDue: periodBalanceDue,
    status: periodStatus,
    count
  };
}

/**
 * Builds clean, polite Hindi reminder message without surrogate-pair emojis
 * that break into question marks ().
 */
export function buildReminderMessageText({
  tenantName = '',
  roomNumber = '',
  billingMonth = '',
  baseRent = 0,
  electricityShare = 0,
  prevMonthElectricityShare = 0,
  daysStayed,
  cycleType = 'MONTHLY',
  cycleDays = 30,
  isBiMonthly = false,
  prevMonthLabel = '',
  currentMonthLabel = '',
  waterShare = 0,
  maintenanceShare = 0,
  carriedForwardDues = 0,
  amountPaid = 0,
  dueDate = 'जल्द से जल्द',
  upiId = 'milanjaviya971-3@okaxis',
  isSms = false
}) {
  const currentTotal = Number(baseRent || 0) + 
    Number(electricityShare || 0) + 
    Number(prevMonthElectricityShare || 0) + 
    Number(waterShare || 0) + 
    Number(maintenanceShare || 0);

  const grossPayable = currentTotal + Number(carriedForwardDues || 0);
  const netDue = grossPayable - Number(amountPaid || 0);

  const bullet = isSms ? '-' : '•';
  const divider = isSms ? '------------------------' : '━━━━━━━━━━━━━━━━━━━━';

  // Electricity label with day-wise & bi-monthly stay info
  let elecText = '';
  if (cycleType === 'NO_BILL' || (Number(electricityShare || 0) === 0 && Number(prevMonthElectricityShare || 0) === 0)) {
    elecText = `${bullet} बिजली बिल: ₹0 (द्विमासिक चक्र - इस महीने कोई बिल नहीं)`;
  } else if (Number(prevMonthElectricityShare || 0) > 0) {
    // 50-50 Split combined across 2 months
    const currLbl = currentMonthLabel || 'इस महीने (50% हिस्सा)';
    const prevLbl = prevMonthLabel || 'पिछले महीने (50% हिस्सा)';
    elecText = `${bullet} बिजली बिल (${currLbl}): ₹${formatINR(electricityShare)}\n${bullet} बिजली बिल (${prevLbl}): ₹${formatINR(prevMonthElectricityShare)}`;
  } else if (isBiMonthly || cycleType === 'BIMONTHLY_60D' || Number(cycleDays || 30) > 31 || Number(daysStayed || 0) > 31) {
    // 60-Day Bi-Monthly bill
    if (Number(daysStayed) === 60) {
      elecText = `${bullet} बिजली बिल (2 महीने / 60 दिन): ₹${formatINR(electricityShare)}`;
    } else {
      elecText = `${bullet} बिजली बिल (${daysStayed} दिन / 60 दिन चक्र): ₹${formatINR(electricityShare)}`;
    }
  } else {
    // Standard Monthly bill
    elecText = `${bullet} बिजली बिल: ₹${formatINR(electricityShare)}`;
    if (daysStayed && Number(daysStayed) < 30) {
      elecText = `${bullet} बिजली बिल (${daysStayed} दिन): ₹${formatINR(electricityShare)}`;
    }
  }

  if (isSms) {
    // Clean text format for SMS apps
    const smsLines = [
      `किराया एवं बिजली बिल भुगतान सूचना`,
      divider,
      `नमस्ते ${tenantName} जी,`,
      `आपके कमरा नं. ${roomNumber} का बिल विवरण (${billingMonth || 'इस महीने'}):`,
      ``,
      `${bullet} कमरे का किराया: ₹${formatINR(baseRent)}`,
      elecText,
    ];

    if (Number(waterShare) > 0) {
      smsLines.push(`${bullet} पानी बिल: ₹${formatINR(waterShare)}`);
    }
    if (Number(maintenanceShare) > 0) {
      smsLines.push(`${bullet} मेंटेनेंस: ₹${formatINR(maintenanceShare)}`);
    }
    if (Number(carriedForwardDues) > 0) {
      smsLines.push(`${bullet} पिछला बकाया: ₹${formatINR(carriedForwardDues)}`);
    }
    if (Number(amountPaid) > 0) {
      smsLines.push(`${bullet} जमा की गई राशि: ₹${formatINR(amountPaid)}`);
    }

    smsLines.push(divider);
    smsLines.push(`कुल देय राशि: ₹${formatINR(netDue)}`);
    smsLines.push(`अंतिम तिथि: ${dueDate}`);
    smsLines.push(``);
    smsLines.push(`UPI भुगतान ID: ${upiId}`);
    smsLines.push(`कृपया भुगतान के बाद स्क्रीनशॉट भेजें।`);
    smsLines.push(`धन्यवाद!`);

    return smsLines.join('\n');
  }

  // Polished WhatsApp format with bold styling (*text*)
  const lines = [
    `*किराया एवं बिजली बिल भुगतान सूचना*`,
    divider,
    `नमस्ते *${tenantName}* जी,`,
    `आपके *कमरा नं. ${roomNumber}* का बिल विवरण (${billingMonth || 'इस महीने'}):`,
    ``,
    `${bullet} *कमरे का किराया:* ₹${formatINR(baseRent)}`,
  ];

  // Add electricity line(s) with bold styling
  elecText.split('\n').forEach(line => {
    lines.push(line.replace(`${bullet} `, `${bullet} *`).replace(':', ':*'));
  });

  if (Number(waterShare) > 0) {
    lines.push(`${bullet} *पानी बिल:* ₹${formatINR(waterShare)}`);
  }
  if (Number(maintenanceShare) > 0) {
    lines.push(`${bullet} *मेंटेनेंस:* ₹${formatINR(maintenanceShare)}`);
  }
  if (Number(carriedForwardDues) > 0) {
    lines.push(`${bullet} *पिछला बकाया:* ₹${formatINR(carriedForwardDues)}`);
  }
  if (Number(amountPaid) > 0) {
    lines.push(`${bullet} *जमा की गई राशि:* ₹${formatINR(amountPaid)}`);
  }

  lines.push(divider);
  lines.push(`*कुल देय राशि: ₹${formatINR(netDue)}*`);
  lines.push(`*अंतिम तिथि:* ${dueDate}`);
  lines.push(``);
  lines.push(`*UPI भुगतान ID:* \`${upiId}\``);
  lines.push(`कृपया भुगतान के बाद स्क्रीनशॉट शेयर करें।`);
  lines.push(`धन्यवाद!`);

  return lines.join('\n');
}

/**
 * Builds official WhatsApp click-to-chat deep link
 */
export function buildWhatsAppReminderUrl(params) {
  const cleanPhone = sanitizePhone(params.phone);
  const message = buildReminderMessageText({ ...params, isSms: false });
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds universal SMS deep link for native messaging apps (Android & iOS)
 */
export function buildSmsReminderUrl(params) {
  const cleanPhone = sanitizePhone(params.phone);
  const message = buildReminderMessageText({ ...params, isSms: true });
  // "?&body=" works universally across both iOS and Android native SMS handlers
  return `sms:+${cleanPhone}?&body=${encodeURIComponent(message)}`;
}
