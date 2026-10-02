const pool = require('../config/db');

/**
 * GET /api/sync
 * Returns full structured rental state from Cloud MySQL
 */
exports.getSyncData = async (req, res) => {
  try {
    // 1. Fetch all rooms
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

    // 2. Fetch all monthly bills
    const [bills] = await pool.query(`
      SELECT * FROM monthly_room_bills ORDER BY id DESC
    `);

    // 3. Fetch all payments
    const [payments] = await pool.query(`
      SELECT * FROM payments ORDER BY id DESC
    `);

    // Construct frontend room structure
    const structuredRooms = rooms.map(r => {
      const roomBill = bills.find(b => b.room_id === r.room_id);
      const roomPayments = payments.filter(p => p.tenant_id === r.tenant_id);

      return {
        room_id: r.room_id,
        room_number: String(r.room_number),
        floor_number: Number(r.floor_number),
        base_rent: Number(r.base_rent),
        is_occupied: Boolean(r.is_occupied),
        description: r.description || `Floor ${r.floor_number} Room ${r.room_number}`,
        tenant: r.tenant_id ? {
          id: r.tenant_id,
          name: r.tenant_name,
          phone: r.phone_number,
          whatsapp: r.whatsapp_number || r.phone_number,
          moveInDate: r.move_in_date,
          securityDeposit: Number(r.security_deposit || 0),
          payments: roomPayments.map(p => ({
            id: p.id,
            amount: Number(p.amount),
            date: p.payment_date,
            mode: p.payment_mode,
            ref: p.reference_id
          }))
        } : null,
        current_bill: roomBill ? {
          id: roomBill.id,
          billing_month: roomBill.billing_month,
          base_rent: Number(roomBill.base_rent),
          electricity_share: Number(roomBill.electricity_share || 0),
          water_share: Number(roomBill.water_share || 0),
          maintenance_share: Number(roomBill.maintenance_share || 0),
          carried_forward_dues: Number(roomBill.carried_forward_dues || 0),
          total_payable: Number(roomBill.total_payable),
          amount_paid: Number(roomBill.amount_paid || 0),
          balance_due: Number(roomBill.balance_due),
          rent_status: roomBill.rent_status || (roomBill.balance_due <= 0 ? 'PAID' : 'PENDING'),
          payment_status: roomBill.payment_status || (roomBill.balance_due <= 0 ? 'PAID' : 'UNPAID'),
          due_date: roomBill.due_date
        } : null
      };
    });

    res.json({
      success: true,
      source: 'TIDB_CLOUD_MYSQL',
      rooms: structuredRooms
    });
  } catch (error) {
    console.error('getSyncData error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/sync
 * Syncs full state or room updates from frontend to Cloud MySQL
 */
exports.saveSyncData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { rooms } = req.body;
    if (!Array.isArray(rooms)) {
      return res.status(400).json({ success: false, message: 'Invalid rooms data array' });
    }

    await connection.beginTransaction();

    for (const r of rooms) {
      // 1. Update Room base rent & occupancy
      await connection.query(
        `UPDATE rooms SET base_rent = ?, is_occupied = ?, description = ? WHERE id = ?`,
        [Number(r.base_rent || 0), Boolean(r.is_occupied), r.description || '', r.room_id]
      );

      // 2. Sync tenant if present
      if (r.tenant && r.is_occupied) {
        // Check if tenant exists
        const [existing] = await connection.query(
          `SELECT id FROM tenants WHERE room_id = ? AND is_active = TRUE`,
          [r.room_id]
        );

        let tenantId = existing.length > 0 ? existing[0].id : null;

        if (tenantId) {
          await connection.query(
            `UPDATE tenants SET full_name = ?, phone_number = ?, whatsapp_number = ?, security_deposit = ? WHERE id = ?`,
            [r.tenant.name, r.tenant.phone || '', r.tenant.whatsapp || r.tenant.phone || '', Number(r.tenant.securityDeposit || 0), tenantId]
          );
        } else {
          const [insertRes] = await connection.query(
            `INSERT INTO tenants (room_id, full_name, phone_number, whatsapp_number, move_in_date, security_deposit, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
            [r.room_id, r.tenant.name, r.tenant.phone || '', r.tenant.whatsapp || r.tenant.phone || '', r.tenant.moveInDate || new Date().toISOString().split('T')[0], Number(r.tenant.securityDeposit || 0)]
          );
          tenantId = insertRes.insertId;
        }

        // 3. Sync bill if present
        if (r.current_bill) {
          const b = r.current_bill;
          const [existingBill] = await connection.query(
            `SELECT id FROM monthly_room_bills WHERE room_id = ? AND billing_month = ?`,
            [r.room_id, b.billing_month || '2026-10']
          );

          if (existingBill.length > 0) {
            await connection.query(
              `UPDATE monthly_room_bills SET base_rent = ?, electricity_share = ?, total_payable = ?, amount_paid = ?, balance_due = ?, payment_status = ? WHERE id = ?`,
              [Number(b.base_rent || 0), Number(b.electricity_share || 0), Number(b.total_payable || 0), Number(b.amount_paid || 0), Number(b.balance_due || 0), b.payment_status || 'UNPAID', existingBill[0].id]
            );
          } else {
            await connection.query(
              `INSERT INTO monthly_room_bills (room_id, billing_month, base_rent, electricity_share, total_payable, amount_paid, balance_due, payment_status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [r.room_id, b.billing_month || '2026-10', Number(b.base_rent || 0), Number(b.electricity_share || 0), Number(b.total_payable || 0), Number(b.amount_paid || 0), Number(b.balance_due || 0), b.payment_status || 'UNPAID', b.due_date || null]
            );
          }
        }
      } else {
        // Room vacant - deactivate any active tenants
        await connection.query(
          `UPDATE tenants SET is_active = FALSE WHERE room_id = ? AND is_active = TRUE`,
          [r.room_id]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Cloud database synchronized successfully!' });
  } catch (error) {
    await connection.rollback();
    console.error('saveSyncData error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};
