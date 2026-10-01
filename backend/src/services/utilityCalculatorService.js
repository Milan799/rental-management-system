const pool = require('../config/db');

/**
 * Service to calculate monthly utility split and generate room bills atomically.
 */
class UtilityCalculatorService {
  /**
   * Preview calculation before committing to DB
   */
  static async previewMonthlySplit({
    billingMonth,
    totalElectricity = 0,
    totalWater = 0,
    commonMaintenance = 0
  }) {
    // 1. Fetch currently active tenants and their room information
    const [occupiedRows] = await pool.query(`
      SELECT 
        t.id AS tenant_id,
        t.full_name AS tenant_name,
        t.phone_number,
        t.whatsapp_number,
        r.id AS room_id,
        r.room_number,
        r.floor_number,
        r.base_rent
      FROM tenants t
      JOIN rooms r ON t.room_id = r.id
      WHERE t.is_active = TRUE AND r.is_occupied = TRUE
      ORDER BY r.floor_number ASC, r.room_number ASC
    `);

    const occupiedCount = occupiedRows.length;
    if (occupiedCount === 0) {
      throw new Error('No occupied rooms found to distribute utility expenses.');
    }

    // 2. Perform equal split among occupied rooms (rounded to 2 decimal places)
    const perRoomElectricity = Number((Number(totalElectricity) / occupiedCount).toFixed(2));
    const perRoomWater = Number((Number(totalWater) / occupiedCount).toFixed(2));
    const perRoomMaintenance = Number((Number(commonMaintenance) / occupiedCount).toFixed(2));

    // 3. For each tenant, check if they have past unpaid balances to carry forward
    const roomBreakdowns = [];

    for (const row of occupiedRows) {
      // Find sum of all unpaid balances from previous months
      const [dueRows] = await pool.query(`
        SELECT COALESCE(SUM(balance_due), 0) AS total_past_arrears
        FROM monthly_room_bills
        WHERE tenant_id = ? AND billing_month < ? AND payment_status != 'PAID'
      `, [row.tenant_id, billingMonth]);

      const carriedForwardDues = Number(dueRows[0]?.total_past_arrears || 0);
      const currentMonthTotal = Number(row.base_rent) + perRoomElectricity + perRoomWater + perRoomMaintenance;
      const totalPayable = currentMonthTotal + carriedForwardDues;

      roomBreakdowns.push({
        roomId: row.room_id,
        roomNumber: row.room_number,
        floorNumber: row.floor_number,
        tenantId: row.tenant_id,
        tenantName: row.tenant_name,
        phone: row.phone_number,
        whatsappNumber: row.whatsapp_number,
        baseRent: Number(row.base_rent),
        electricityShare: perRoomElectricity,
        waterShare: perRoomWater,
        maintenanceShare: perRoomMaintenance,
        carriedForwardDues,
        currentMonthTotal,
        totalPayable
      });
    }

    return {
      billingMonth,
      occupiedRoomsCount: occupiedCount,
      totalElectricity: Number(totalElectricity),
      totalWater: Number(totalWater),
      commonMaintenance: Number(commonMaintenance),
      perRoomElectricity,
      perRoomWater,
      perRoomMaintenance,
      breakdowns: roomBreakdowns
    };
  }

  /**
   * Generates and commits the monthly bills into MySQL inside an ACID transaction
   */
  static async generateMonthlyBills({
    billingMonth,
    totalElectricity = 0,
    totalWater = 0,
    commonMaintenance = 0,
    dueDate,
    notes = ''
  }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check if billing batch for this month already exists
      const [existingBatch] = await connection.query(
        'SELECT id FROM monthly_utility_batches WHERE billing_month = ? FOR UPDATE',
        [billingMonth]
      );

      if (existingBatch.length > 0) {
        throw new Error(`Bills for month ${billingMonth} have already been generated. Edit or settle existing bills instead.`);
      }

      // 1. Get active tenants and occupied rooms
      const [occupiedRows] = await connection.query(`
        SELECT 
          t.id AS tenant_id,
          t.full_name AS tenant_name,
          r.id AS room_id,
          r.room_number,
          r.base_rent
        FROM tenants t
        JOIN rooms r ON t.room_id = r.id
        WHERE t.is_active = TRUE AND r.is_occupied = TRUE
      `);

      const occupiedCount = occupiedRows.length;
      if (occupiedCount === 0) {
        throw new Error('Cannot generate bills: No occupied rooms found.');
      }

      // Calculate shares
      const perRoomElectricity = Number((Number(totalElectricity) / occupiedCount).toFixed(2));
      const perRoomWater = Number((Number(totalWater) / occupiedCount).toFixed(2));
      const perRoomMaintenance = Number((Number(commonMaintenance) / occupiedCount).toFixed(2));

      // 2. Insert Master Utility Batch Record
      const [batchResult] = await connection.query(`
        INSERT INTO monthly_utility_batches 
        (billing_month, total_electricity_amount, total_water_amount, common_maintenance_amount, occupied_rooms_count, per_room_electricity, per_room_water, per_room_maintenance, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        billingMonth,
        totalElectricity,
        totalWater,
        commonMaintenance,
        occupiedCount,
        perRoomElectricity,
        perRoomWater,
        perRoomMaintenance,
        notes
      ]);

      const batchId = batchResult.insertId;
      const computedDueDate = dueDate || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0];

      // 3. Insert individual room bills
      const generatedBills = [];

      for (const row of occupiedRows) {
        // Query historical pending dues for this tenant
        const [pastDues] = await connection.query(`
          SELECT COALESCE(SUM(balance_due), 0) AS total_past_arrears
          FROM monthly_room_bills
          WHERE tenant_id = ? AND billing_month < ? AND payment_status != 'PAID'
        `, [row.tenant_id, billingMonth]);

        const carriedForwardDues = Number(pastDues[0]?.total_past_arrears || 0);
        const totalPayable = Number(row.base_rent) + perRoomElectricity + perRoomWater + perRoomMaintenance + carriedForwardDues;

        const [billResult] = await connection.query(`
          INSERT INTO monthly_room_bills
          (batch_id, room_id, tenant_id, billing_month, base_rent, electricity_share, water_share, maintenance_share, carried_forward_dues, total_payable, amount_paid, rent_status, electricity_status, water_status, payment_status, due_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 'PENDING', 'PENDING', 'PENDING', 'UNPAID', ?)
        `, [
          batchId,
          row.room_id,
          row.tenant_id,
          billingMonth,
          row.base_rent,
          perRoomElectricity,
          perRoomWater,
          perRoomMaintenance,
          carriedForwardDues,
          totalPayable,
          computedDueDate
        ]);

        generatedBills.push({
          billId: billResult.insertId,
          roomNumber: row.room_number,
          tenantName: row.tenant_name,
          totalPayable
        });
      }

      await connection.commit();

      return {
        batchId,
        billingMonth,
        occupiedRoomsCount: occupiedCount,
        billsGenerated: generatedBills.length,
        bills: generatedBills
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = UtilityCalculatorService;
