const pool = require('../config/db');

/**
 * GET /api/sync
 * Returns full structured rental state from Cloud MySQL
 */
exports.getSyncData = async (req, res) => {
  try {
    // 1. Fetch all rooms with active tenants
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
        t.security_deposit,
        t.emergency_contact
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

    // Construct frontend room structure supporting both naming conventions
    const structuredRooms = rooms.map(r => {
      const roomBill = bills.find(b => b.room_id === r.room_id);
      const roomPayments = payments.filter(p => p.tenant_id === r.tenant_id);

      const formattedMoveIn = r.move_in_date 
        ? new Date(r.move_in_date).toISOString().split('T')[0] 
        : '';

      return {
        room_id: r.room_id,
        room_number: String(r.room_number),
        floor_number: Number(r.floor_number),
        base_rent: Number(r.base_rent),
        is_occupied: Boolean(r.is_occupied || r.tenant_id),
        description: r.description || `Floor ${r.floor_number} Room ${r.room_number}`,
        tenant: r.tenant_id ? {
          id: r.tenant_id,
          tenant_id: r.tenant_id,
          full_name: r.tenant_name,
          name: r.tenant_name,
          phone_number: r.phone_number || '',
          phone: r.phone_number || '',
          whatsapp_number: r.whatsapp_number || r.phone_number || '',
          whatsapp: r.whatsapp_number || r.phone_number || '',
          move_in_date: formattedMoveIn,
          moveInDate: formattedMoveIn,
          security_deposit: Number(r.security_deposit || 0),
          securityDeposit: Number(r.security_deposit || 0),
          emergency_contact: r.emergency_contact || '',
          emergencyContact: r.emergency_contact || '',
          payments: roomPayments.map(p => ({
            id: p.id,
            amount: Number(p.amount_paid ?? p.amount ?? 0),
            amountPaid: Number(p.amount_paid ?? p.amount ?? 0),
            date: p.payment_date ? new Date(p.payment_date).toISOString() : new Date().toISOString(),
            mode: p.payment_mode || 'UPI',
            ref: p.transaction_reference || p.ref || '',
            transactionReference: p.transaction_reference || p.ref || '',
            notes: p.notes || ''
          }))
        } : null,
        current_bill: roomBill ? {
          id: roomBill.id,
          bill_id: roomBill.id,
          billing_month: roomBill.billing_month,
          base_rent: Number(roomBill.base_rent),
          electricity_share: Number(roomBill.electricity_share || 0),
          water_share: Number(roomBill.water_share || 0),
          maintenance_share: Number(roomBill.maintenance_share || 0),
          carried_forward_dues: Number(roomBill.carried_forward_dues || 0),
          total_payable: Number(roomBill.total_payable),
          amount_paid: Number(roomBill.amount_paid || 0),
          balance_due: Number(roomBill.balance_due ?? (Number(roomBill.total_payable) - Number(roomBill.amount_paid || 0))),
          rent_status: roomBill.rent_status || 'PENDING',
          electricity_status: roomBill.electricity_status || 'PENDING',
          water_status: roomBill.water_status || 'PENDING',
          payment_status: roomBill.payment_status || (roomBill.balance_due <= 0 ? 'PAID' : 'UNPAID'),
          due_date: roomBill.due_date ? new Date(roomBill.due_date).toISOString().split('T')[0] : null
        } : null
      };
    });

    res.json({
      success: true,
      source: 'TIDB_CLOUD_MYSQL',
      updatedAt: new Date().toISOString(),
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
      const isOccupied = Boolean(r.is_occupied && r.tenant);
      const baseRent = Number(r.base_rent || 0);
      const desc = r.description || `Floor ${r.floor_number || 1} Room ${r.room_number}`;

      // 1. Update Room base rent & occupancy
      await connection.query(
        `UPDATE rooms SET base_rent = ?, is_occupied = ?, description = ? WHERE id = ?`,
        [baseRent, isOccupied ? 1 : 0, desc, r.room_id]
      );

      // 2. Sync tenant if room is occupied
      if (isOccupied && r.tenant) {
        const fullName = (r.tenant.full_name || r.tenant.name || `Tenant Room ${r.room_number}`).trim();
        const phone = (r.tenant.phone_number || r.tenant.phone || '').trim();
        const whatsapp = (r.tenant.whatsapp_number || r.tenant.whatsapp || phone).trim();
        const moveIn = r.tenant.move_in_date || r.tenant.moveInDate || new Date().toISOString().split('T')[0];
        const deposit = Number(r.tenant.security_deposit ?? r.tenant.securityDeposit ?? 0);
        const emergency = r.tenant.emergency_contact || r.tenant.emergencyContact || null;

        // Check if active tenant exists for this room
        const [existingTenants] = await connection.query(
          `SELECT id FROM tenants WHERE room_id = ? AND is_active = TRUE`,
          [r.room_id]
        );

        let tenantId = existingTenants.length > 0 ? existingTenants[0].id : null;

        if (tenantId) {
          await connection.query(
            `UPDATE tenants 
             SET full_name = ?, phone_number = ?, whatsapp_number = ?, move_in_date = ?, security_deposit = ?, emergency_contact = ?, is_active = TRUE, vacated_at = NULL 
             WHERE id = ?`,
            [fullName, phone, whatsapp, moveIn, deposit, emergency, tenantId]
          );
        } else {
          const [insertRes] = await connection.query(
            `INSERT INTO tenants 
             (room_id, full_name, phone_number, whatsapp_number, move_in_date, security_deposit, emergency_contact, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [r.room_id, fullName, phone, whatsapp, moveIn, deposit, emergency]
          );
          tenantId = insertRes.insertId;
        }

        // 3. Sync bill if present
        let currentBillId = null;
        if (r.current_bill) {
          const b = r.current_bill;
          const billingMonth = b.billing_month || new Date().toISOString().slice(0, 7);
          const billBaseRent = Number(b.base_rent ?? baseRent ?? 0);
          const elecShare = Number(b.electricity_share || 0);
          const waterShare = Number(b.water_share || 0);
          const maintShare = Number(b.maintenance_share || 0);
          const carriedDues = Number(b.carried_forward_dues || 0);
          const totalPayable = Number(b.total_payable ?? (billBaseRent + elecShare + waterShare + maintShare + carriedDues));
          const amountPaid = Number(b.amount_paid || 0);
          const paymentStatus = b.payment_status || (totalPayable <= amountPaid ? 'PAID' : (amountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID'));
          const rentStatus = b.rent_status || (amountPaid >= billBaseRent ? 'PAID' : 'PENDING');
          const elecStatus = b.electricity_status || (paymentStatus === 'PAID' ? 'PAID' : 'PENDING');
          const waterStatus = b.water_status || (paymentStatus === 'PAID' ? 'PAID' : 'PENDING');
          const dueDate = b.due_date ? new Date(b.due_date).toISOString().split('T')[0] : new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

          // Ensure a master batch exists for the month
          let [batches] = await connection.query(
            `SELECT id FROM monthly_utility_batches WHERE billing_month = ?`,
            [billingMonth]
          );
          let batchId;
          if (batches.length > 0) {
            batchId = batches[0].id;
          } else {
            const [batchInsert] = await connection.query(
              `INSERT INTO monthly_utility_batches 
               (billing_month, total_electricity_amount, total_water_amount, common_maintenance_amount, occupied_rooms_count, per_room_electricity, per_room_water, per_room_maintenance, notes) 
               VALUES (?, 0, 0, 0, 1, 0, 0, 0, 'Auto-generated on Cloud Sync')`,
              [billingMonth]
            );
            batchId = batchInsert.insertId;
          }

          const [existingBill] = await connection.query(
            `SELECT id FROM monthly_room_bills WHERE room_id = ? AND billing_month = ?`,
            [r.room_id, billingMonth]
          );

          if (existingBill.length > 0) {
            currentBillId = existingBill[0].id;
            // NOTE: Do not update balance_due as it is a STORED GENERATED column
            await connection.query(
              `UPDATE monthly_room_bills 
               SET tenant_id = ?, batch_id = ?, base_rent = ?, electricity_share = ?, water_share = ?, maintenance_share = ?, carried_forward_dues = ?, total_payable = ?, amount_paid = ?, rent_status = ?, electricity_status = ?, water_status = ?, payment_status = ?, due_date = ? 
               WHERE id = ?`,
              [tenantId, batchId, billBaseRent, elecShare, waterShare, maintShare, carriedDues, totalPayable, amountPaid, rentStatus, elecStatus, waterStatus, paymentStatus, dueDate, currentBillId]
            );
          } else {
            const [billInsert] = await connection.query(
              `INSERT INTO monthly_room_bills 
               (batch_id, room_id, tenant_id, billing_month, base_rent, electricity_share, water_share, maintenance_share, carried_forward_dues, total_payable, amount_paid, rent_status, electricity_status, water_status, payment_status, due_date) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [batchId, r.room_id, tenantId, billingMonth, billBaseRent, elecShare, waterShare, maintShare, carriedDues, totalPayable, amountPaid, rentStatus, elecStatus, waterStatus, paymentStatus, dueDate]
            );
            currentBillId = billInsert.insertId;
          }
        }

        // 4. Sync payment history if provided
        if (currentBillId && Array.isArray(r.tenant.payments) && r.tenant.payments.length > 0) {
          for (const p of r.tenant.payments) {
            const pAmount = Number(p.amount ?? p.amountPaid ?? 0);
            if (pAmount > 0) {
              const pRef = p.ref || p.transactionReference || '';
              const pMode = p.mode || p.paymentMode || 'UPI';
              const pNotes = p.notes || '';

              // Check if payment already exists
              const [existingPayment] = await connection.query(
                `SELECT id FROM payments WHERE bill_id = ? AND amount_paid = ? AND transaction_reference = ? LIMIT 1`,
                [currentBillId, pAmount, pRef]
              );

              if (existingPayment.length === 0) {
                await connection.query(
                  `INSERT INTO payments (bill_id, tenant_id, room_id, amount_paid, payment_mode, transaction_reference, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [currentBillId, tenantId, r.room_id, pAmount, pMode, pRef, pNotes]
                );
              }
            }
          }
        }
      } else {
        // Room vacant - deactivate any active tenants only if room genuinely has no tenant
        if (!r.tenant) {
          await connection.query(
            `UPDATE tenants SET is_active = FALSE, vacated_at = COALESCE(vacated_at, CURDATE()) WHERE room_id = ? AND is_active = TRUE`,
            [r.room_id]
          );
        }
      }
    }

    await connection.commit();
    res.json({ 
      success: true, 
      message: 'TiDB Cloud database synchronized successfully!',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    await connection.rollback();
    console.error('saveSyncData error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};
