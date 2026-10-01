const pool = require('../config/db');
const UtilityCalculatorService = require('../services/utilityCalculatorService');
const { generateWhatsAppReminderUrl } = require('../utils/whatsappHelper');

/**
 * Preview Monthly Split prior to generation
 */
exports.previewMonthlySplit = async (req, res) => {
  try {
    const { billingMonth, totalElectricity, totalWater, commonMaintenance } = req.body;
    
    if (!billingMonth) {
      return res.status(400).json({ success: false, message: 'billingMonth is required (e.g. YYYY-MM)' });
    }

    const preview = await UtilityCalculatorService.previewMonthlySplit({
      billingMonth,
      totalElectricity: Number(totalElectricity || 0),
      totalWater: Number(totalWater || 0),
      commonMaintenance: Number(commonMaintenance || 0)
    });

    res.json({ success: true, data: preview });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Generate and commit Monthly Bills
 */
exports.generateMonthlyBills = async (req, res) => {
  try {
    const { billingMonth, totalElectricity, totalWater, commonMaintenance, dueDate, notes } = req.body;

    if (!billingMonth) {
      return res.status(400).json({ success: false, message: 'billingMonth is required (e.g. YYYY-MM)' });
    }

    const result = await UtilityCalculatorService.generateMonthlyBills({
      billingMonth,
      totalElectricity: Number(totalElectricity || 0),
      totalWater: Number(totalWater || 0),
      commonMaintenance: Number(commonMaintenance || 0),
      dueDate,
      notes
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Fetch all bills for a given month with tenant and room details
 */
exports.getMonthlyBills = async (req, res) => {
  try {
    const { month } = req.params; // 'YYYY-MM'

    const [bills] = await pool.query(`
      SELECT 
        b.id AS bill_id,
        b.billing_month,
        b.base_rent,
        b.electricity_share,
        b.water_share,
        b.maintenance_share,
        b.carried_forward_dues,
        b.total_payable,
        b.amount_paid,
        b.balance_due,
        b.rent_status,
        b.electricity_status,
        b.water_status,
        b.payment_status,
        b.due_date,
        r.id AS room_id,
        r.room_number,
        r.floor_number,
        t.id AS tenant_id,
        t.full_name AS tenant_name,
        t.phone_number,
        t.whatsapp_number
      FROM monthly_room_bills b
      JOIN rooms r ON b.room_id = r.id
      JOIN tenants t ON b.tenant_id = t.id
      WHERE b.billing_month = ?
      ORDER BY r.floor_number ASC, r.room_number ASC
    `, [month]);

    // Attach generated WhatsApp link to each record
    const enhancedBills = bills.map(b => {
      const whatsappUrl = generateWhatsAppReminderUrl({
        tenantName: b.tenant_name,
        roomNumber: b.room_number,
        phone: b.whatsapp_number || b.phone_number,
        billingMonth: b.billing_month,
        baseRent: b.base_rent,
        electricityShare: b.electricity_share,
        waterShare: b.water_share,
        maintenanceShare: b.maintenance_share,
        carriedForwardDues: b.carried_forward_dues,
        amountPaid: b.amount_paid,
        dueDate: b.due_date
      });

      return {
        ...b,
        whatsappReminderUrl: whatsappUrl
      };
    });

    res.json({ success: true, data: enhancedBills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Record a payment against a bill
 */
exports.recordPayment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { billId } = req.params;
    const { amountPaid, paymentMode = 'UPI', transactionReference = '', notes = '' } = req.body;

    const paymentAmount = Number(amountPaid);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amountPaid is required.' });
    }

    await connection.beginTransaction();

    // 1. Get current bill state
    const [bills] = await connection.query(
      'SELECT * FROM monthly_room_bills WHERE id = ? FOR UPDATE',
      [billId]
    );

    if (bills.length === 0) {
      throw new Error('Bill not found.');
    }

    const bill = bills[0];
    const newTotalPaid = Number(bill.amount_paid) + paymentAmount;
    const remainingBalance = Number(bill.total_payable) - newTotalPaid;

    if (paymentAmount > Number(bill.balance_due)) {
      throw new Error(`Payment amount (₹${paymentAmount}) exceeds pending balance (₹${bill.balance_due}).`);
    }

    // Determine status
    let paymentStatus = 'PARTIALLY_PAID';
    let rentStatus = bill.rent_status;
    let electricityStatus = bill.electricity_status;
    let waterStatus = bill.water_status;

    if (remainingBalance <= 0) {
      paymentStatus = 'PAID';
      rentStatus = 'PAID';
      electricityStatus = 'PAID';
      waterStatus = 'PAID';
    } else {
      // Prioritize rent first, then electricity, then water
      if (newTotalPaid >= Number(bill.base_rent)) {
        rentStatus = 'PAID';
      }
      if (newTotalPaid >= (Number(bill.base_rent) + Number(bill.electricity_share))) {
        electricityStatus = 'PAID';
      }
    }

    // 2. Insert payment log
    await connection.query(`
      INSERT INTO payments (bill_id, tenant_id, room_id, amount_paid, payment_mode, transaction_reference, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [bill.id, bill.tenant_id, bill.room_id, paymentAmount, paymentMode, transactionReference, notes]);

    // 3. Update monthly room bill
    await connection.query(`
      UPDATE monthly_room_bills
      SET 
        amount_paid = ?,
        rent_status = ?,
        electricity_status = ?,
        water_status = ?,
        payment_status = ?
      WHERE id = ?
    `, [newTotalPaid, rentStatus, electricityStatus, waterStatus, paymentStatus, billId]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        billId,
        paymentAmount,
        totalPaid: newTotalPaid,
        remainingBalance,
        paymentStatus
      }
    });

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

/**
 * Generate a dynamic WhatsApp link for a specific bill
 */
exports.getWhatsAppReminderLink = async (req, res) => {
  try {
    const { billId } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        b.*,
        t.full_name AS tenant_name,
        t.whatsapp_number,
        t.phone_number,
        r.room_number
      FROM monthly_room_bills b
      JOIN tenants t ON b.tenant_id = t.id
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `, [billId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const b = rows[0];
    const link = generateWhatsAppReminderUrl({
      tenantName: b.tenant_name,
      roomNumber: b.room_number,
      phone: b.whatsapp_number || b.phone_number,
      billingMonth: b.billing_month,
      baseRent: b.base_rent,
      electricityShare: b.electricity_share,
      waterShare: b.water_share,
      maintenanceShare: b.maintenance_share,
      carriedForwardDues: b.carried_forward_dues,
      amountPaid: b.amount_paid,
      dueDate: b.due_date
    });

    res.json({ success: true, data: { url: link } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
