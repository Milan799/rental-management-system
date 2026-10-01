const pool = require('../config/db');

/**
 * Service to handle tenant vacating, security deposit reconciliation, and room clearing
 */
class SettlementService {
  /**
   * Preview settlement calculation before final execution
   */
  static async previewSettlement(tenantId) {
    const [tenantRows] = await pool.query(`
      SELECT 
        t.id AS tenant_id,
        t.full_name,
        t.phone_number,
        t.move_in_date,
        t.security_deposit,
        r.id AS room_id,
        r.room_number,
        r.floor_number
      FROM tenants t
      JOIN rooms r ON t.room_id = r.id
      WHERE t.id = ? AND t.is_active = TRUE
    `, [tenantId]);

    if (tenantRows.length === 0) {
      throw new Error('Active tenant not found.');
    }

    const tenant = tenantRows[0];

    // Get all outstanding unpaid bills
    const [unpaidBills] = await pool.query(`
      SELECT 
        id, 
        billing_month, 
        base_rent, 
        electricity_share, 
        water_share, 
        total_payable, 
        amount_paid, 
        balance_due
      FROM monthly_room_bills
      WHERE tenant_id = ? AND payment_status != 'PAID'
      ORDER BY billing_month ASC
    `, [tenantId]);

    const totalPendingDues = unpaidBills.reduce((acc, curr) => acc + Number(curr.balance_due), 0);
    const securityDeposit = Number(tenant.security_deposit);
    const netRefundable = securityDeposit - totalPendingDues;

    return {
      tenant: {
        id: tenant.tenant_id,
        name: tenant.full_name,
        phone: tenant.phone_number,
        moveInDate: tenant.move_in_date,
        roomId: tenant.room_id,
        roomNumber: tenant.room_number,
        floorNumber: tenant.floor_number,
        securityDeposit
      },
      unpaidBills,
      totalPendingDues,
      estimatedNetRefundable: netRefundable
    };
  }

  /**
   * Finalize and execute the vacating settlement inside an ACID transaction
   */
  static async finalizeSettlement({
    tenantId,
    damageOrRepairDeducted = 0,
    settlementNotes = '',
    vacateDate = new Date().toISOString().split('T')[0]
  }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Fetch tenant & room details with lock
      const [tenants] = await connection.query(`
        SELECT id, room_id, security_deposit 
        FROM tenants 
        WHERE id = ? AND is_active = TRUE 
        FOR UPDATE
      `, [tenantId]);

      if (tenants.length === 0) {
        throw new Error('Tenant is already vacated or not found.');
      }

      const tenant = tenants[0];
      const roomId = tenant.room_id;
      const securityDeposit = Number(tenant.security_deposit);

      // 2. Sum up pending dues
      const [pendingBills] = await connection.query(`
        SELECT id, balance_due 
        FROM monthly_room_bills 
        WHERE tenant_id = ? AND payment_status != 'PAID'
        FOR UPDATE
      `, [tenantId]);

      const pendingDuesTotal = pendingBills.reduce((acc, curr) => acc + Number(curr.balance_due), 0);
      const damageDeduction = Number(damageOrRepairDeducted);
      const totalDeductions = pendingDuesTotal + damageDeduction;
      const netRefundable = securityDeposit - totalDeductions;

      let refundStatus = 'REFUNDED';
      if (netRefundable < 0) {
        refundStatus = 'RECOVERED_FROM_TENANT';
      } else if (netRefundable === 0) {
        refundStatus = 'SETTLED_ZERO';
      }

      // 3. Mark pending bills as PAID via deposit deduction
      for (const bill of pendingBills) {
        await connection.query(`
          UPDATE monthly_room_bills 
          SET 
            amount_paid = total_payable,
            rent_status = 'PAID',
            electricity_status = 'PAID',
            water_status = 'PAID',
            payment_status = 'PAID'
          WHERE id = ?
        `, [bill.id]);

        // Record a settlement payment entry
        await connection.query(`
          INSERT INTO payments (bill_id, tenant_id, room_id, amount_paid, payment_mode, notes)
          VALUES (?, ?, ?, ?, 'CHEQUE', 'Settled via Security Deposit deduction on vacating')
        `, [bill.id, tenantId, roomId, bill.balance_due]);
      }

      // 4. Create Settlement Record
      const [settlementResult] = await connection.query(`
        INSERT INTO tenant_settlements
        (tenant_id, room_id, vacate_date, security_deposit_held, pending_dues_deducted, damage_or_repair_deducted, net_refundable_amount, refund_status, settlement_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        tenantId,
        roomId,
        vacateDate,
        securityDeposit,
        pendingDuesTotal,
        damageDeduction,
        netRefundable,
        refundStatus,
        settlementNotes
      ]);

      // 5. Inactivate Tenant and mark vacated date
      await connection.query(`
        UPDATE tenants 
        SET is_active = FALSE, vacated_at = ?
        WHERE id = ?
      `, [vacateDate, tenantId]);

      // 6. Free up room for new entry
      await connection.query(`
        UPDATE rooms 
        SET is_occupied = FALSE 
        WHERE id = ?
      `, [roomId]);

      await connection.commit();

      return {
        settlementId: settlementResult.insertId,
        tenantId,
        roomId,
        securityDepositHeld: securityDeposit,
        pendingDuesDeducted: pendingDuesTotal,
        damageDeducted: damageDeduction,
        netRefundableAmount: netRefundable,
        refundStatus,
        message: 'Tenant settled successfully. Room is now vacant and ready for new occupant.'
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = SettlementService;
