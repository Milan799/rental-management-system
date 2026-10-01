const pool = require('../config/db');
const SettlementService = require('../services/settlementService');

/**
 * Get all 7 rooms with current status and active tenant details
 */
exports.getAllRooms = async (req, res) => {
  try {
    const [rooms] = await pool.query(`
      SELECT 
        r.id AS room_id,
        r.room_number,
        r.floor_number,
        r.base_rent,
        r.is_occupied,
        r.description,
        t.id AS tenant_id,
        t.full_name AS tenant_name,
        t.phone_number,
        t.whatsapp_number,
        t.move_in_date,
        t.security_deposit
      FROM rooms r
      LEFT JOIN tenants t ON r.id = t.room_id AND t.is_active = TRUE
      ORDER BY r.floor_number ASC, r.room_number ASC
    `);

    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Onboard a new tenant into a vacant room
 */
exports.createTenant = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      roomId,
      fullName,
      phoneNumber,
      whatsappNumber,
      moveInDate,
      securityDeposit = 0,
      emergencyContact,
      idProofNumber
    } = req.body;

    if (!roomId || !fullName || !phoneNumber || !moveInDate) {
      return res.status(400).json({ success: false, message: 'Room, Name, Phone, and Move-in Date are required.' });
    }

    await connection.beginTransaction();

    // Verify room is currently vacant
    const [roomRows] = await connection.query(
      'SELECT id, is_occupied, base_rent FROM rooms WHERE id = ? FOR UPDATE',
      [roomId]
    );

    if (roomRows.length === 0) {
      throw new Error('Room not found.');
    }

    if (roomRows[0].is_occupied) {
      throw new Error('This room is already occupied. Settle the previous tenant first.');
    }

    // Insert tenant
    const [tenantResult] = await connection.query(`
      INSERT INTO tenants 
      (room_id, full_name, phone_number, whatsapp_number, move_in_date, security_deposit, emergency_contact, id_proof_number, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [
      roomId,
      fullName,
      phoneNumber,
      whatsappNumber || phoneNumber,
      moveInDate,
      securityDeposit,
      emergencyContact || null,
      idProofNumber || null
    ]);

    // Update room occupancy
    await connection.query('UPDATE rooms SET is_occupied = TRUE WHERE id = ?', [roomId]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Tenant onboarded successfully!',
      data: {
        tenantId: tenantResult.insertId,
        roomId,
        fullName
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
 * Get complete Ledger and Payment History for a tenant
 */
exports.getTenantLedger = async (req, res) => {
  try {
    const { id } = req.params;

    // Tenant info
    const [tenants] = await pool.query(`
      SELECT t.*, r.room_number, r.floor_number, r.base_rent
      FROM tenants t
      JOIN rooms r ON t.room_id = r.id
      WHERE t.id = ?
    `, [id]);

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found.' });
    }

    // Monthly bills
    const [bills] = await pool.query(`
      SELECT * FROM monthly_room_bills 
      WHERE tenant_id = ?
      ORDER BY billing_month DESC
    `, [id]);

    // Payments
    const [payments] = await pool.query(`
      SELECT * FROM payments 
      WHERE tenant_id = ?
      ORDER BY payment_date DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        tenant: tenants[0],
        bills,
        payments
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Preview tenant vacating settlement
 */
exports.previewSettlement = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const preview = await SettlementService.previewSettlement(tenantId);
    res.json({ success: true, data: preview });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Finalize tenant vacating settlement
 */
exports.finalizeSettlement = async (req, res) => {
  try {
    const { tenantId, damageOrRepairDeducted, settlementNotes, vacateDate } = req.body;
    const result = await SettlementService.finalizeSettlement({
      tenantId,
      damageOrRepairDeducted: Number(damageOrRepairDeducted || 0),
      settlementNotes,
      vacateDate
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Update existing tenant details (Name, Phone, Deposit, Rent, etc.)
 */
exports.updateTenant = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      fullName,
      phoneNumber,
      whatsappNumber,
      moveInDate,
      securityDeposit,
      emergencyContact,
      baseRent
    } = req.body;

    await connection.beginTransaction();

    const [tenantRows] = await connection.query(
      'SELECT id, room_id FROM tenants WHERE id = ? FOR UPDATE',
      [id]
    );

    if (tenantRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Tenant not found.' });
    }

    const roomId = tenantRows[0].room_id;

    await connection.query(
      `UPDATE tenants 
       SET full_name = COALESCE(?, full_name),
           phone_number = COALESCE(?, phone_number),
           whatsapp_number = COALESCE(?, whatsapp_number),
           move_in_date = COALESCE(?, move_in_date),
           security_deposit = COALESCE(?, security_deposit),
           emergency_contact = COALESCE(?, emergency_contact)
       WHERE id = ?`,
      [fullName, phoneNumber, whatsappNumber, moveInDate, securityDeposit, emergencyContact, id]
    );

    if (baseRent !== undefined && baseRent !== null) {
      await connection.query('UPDATE rooms SET base_rent = ? WHERE id = ?', [baseRent, roomId]);
    }

    await connection.commit();
    res.json({ success: true, message: 'Tenant details updated successfully.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

