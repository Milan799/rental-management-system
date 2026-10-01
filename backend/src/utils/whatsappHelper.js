/**
 * WhatsApp Click-to-Chat API Link Generator
 * Generates an official WhatsApp URL prefilled with an itemized payment breakdown.
 */

/**
 * Normalizes phone number into international E.164-compatible digits format
 * E.g., '9876543210' -> '919876543210' (defaults to India +91 if 10 digits)
 */
function sanitizePhoneNumber(phone, defaultCountryCode = '91') {
  if (!phone) return '';
  const digits = phone.toString().replace(/\D/g, '');
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }
  return digits;
}

/**
 * Formats numbers into Indian Rupee format
 */
function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
}

/**
 * Generates dynamic WhatsApp Reminder Click-to-Chat link
 * 
 * @param {Object} params
 * @param {string} params.tenantName - Name of the tenant
 * @param {string} params.roomNumber - Room number (e.g., '101', '202')
 * @param {string} params.phone - Contact / WhatsApp number
 * @param {string} params.billingMonth - Month of the bill (e.g. 'October 2026')
 * @param {number} params.baseRent - Fixed room rent
 * @param {number} params.electricityShare - Tenant's share of electricity
 * @param {number} params.waterShare - Tenant's share of water
 * @param {number} [params.maintenanceShare=0] - Tenant's share of common expenses
 * @param {number} [params.carriedForwardDues=0] - Previous pending balance
 * @param {number} [params.amountPaid=0] - Any partial amount already paid
 * @param {string} [params.dueDate] - Optional payment due date
 * @param {string} [params.upiId] - Landlord UPI ID for instant payment
 * @returns {string} Fully encoded WhatsApp URL
 */
function generateWhatsAppReminderUrl({
  tenantName,
  roomNumber,
  phone,
  billingMonth,
  baseRent = 0,
  electricityShare = 0,
  waterShare = 0,
  maintenanceShare = 0,
  carriedForwardDues = 0,
  amountPaid = 0,
  dueDate = 'within 3 days',
  upiId = 'milanjaviya971-3@okaxis'
}) {
  const cleanPhone = sanitizePhoneNumber(phone);
  const totalCurrentBill = Number(baseRent) + Number(electricityShare) + Number(waterShare) + Number(maintenanceShare);
  const grossPayable = totalCurrentBill + Number(carriedForwardDues);
  const netDue = grossPayable - Number(amountPaid);

  // Structured multi-line message using WhatsApp markdown (*bold*, _italic_)
  const lines = [
    `🏢 *RENT & UTILITY BILL REMINDER*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Hello *${tenantName}*,`,
    `Here is your monthly invoice summary for *Room ${roomNumber}* (${billingMonth}):`,
    ``,
    `🏠 *Monthly Fixed Rent:* ₹${formatCurrency(baseRent)}`,
    `⚡ *Electricity Share:* ₹${formatCurrency(electricityShare)}`,
    `💧 *Water Bill Share:* ₹${formatCurrency(waterShare)}`,
  ];

  if (maintenanceShare > 0) {
    lines.push(`🧹 *Common Maintenance:* ₹${formatCurrency(maintenanceShare)}`);
  }

  if (carriedForwardDues > 0) {
    lines.push(`⚠️ *Previous Pending Dues:* ₹${formatCurrency(carriedForwardDues)}`);
  }

  if (amountPaid > 0) {
    lines.push(`✅ *Amount Already Paid:* ₹${formatCurrency(amountPaid)}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💰 *Total Balance Due: ₹${formatCurrency(netDue)}*`);
  lines.push(`📅 *Due Date:* ${dueDate}`);
  lines.push(``);
  lines.push(`📲 *Quick UPI Payment:* \`${upiId}\``);
  lines.push(`Please share the transaction screenshot after payment.`);
  lines.push(`Thank you for your cooperation! 🙏`);

  const rawMessage = lines.join('\n');
  const encodedMessage = encodeURIComponent(rawMessage);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

module.exports = {
  sanitizePhoneNumber,
  formatCurrency,
  generateWhatsAppReminderUrl
};
