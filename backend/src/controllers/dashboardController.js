const pool = require('../config/db');

/**
 * Controller for high-level property statistics and KPIs
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const currentMonth = req.query.month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    // 1. Room Occupancy Stats
    const [roomStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_rooms,
        SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) AS occupied_rooms,
        SUM(CASE WHEN is_occupied = FALSE THEN 1 ELSE 0 END) AS vacant_rooms
      FROM rooms
    `);

    // 2. Floor-wise Breakdown
    const [floorStats] = await pool.query(`
      SELECT 
        floor_number,
        COUNT(*) AS total,
        SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) AS occupied
      FROM rooms
      GROUP BY floor_number
      ORDER BY floor_number ASC
    `);

    // 3. Current Month Financials (Expected, Collected, Pending)
    const [monthFinancials] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_payable), 0) AS expected_revenue,
        COALESCE(SUM(amount_paid), 0) AS total_collected,
        COALESCE(SUM(balance_due), 0) AS current_month_pending
      FROM monthly_room_bills
      WHERE billing_month = ?
    `, [currentMonth]);

    // 4. Overall All-Time Pending Dues across all active rooms
    const [allTimePending] = await pool.query(`
      SELECT COALESCE(SUM(balance_due), 0) AS total_pending_dues
      FROM monthly_room_bills
      WHERE payment_status != 'PAID'
    `);

    // 5. Utility Batch for Current Month (if created)
    const [utilityBatch] = await pool.query(`
      SELECT * FROM monthly_utility_batches WHERE billing_month = ?
    `, [currentMonth]);

    res.json({
      success: true,
      data: {
        currentMonth,
        occupancy: {
          totalRooms: roomStats[0].total_rooms || 7,
          occupied: Number(roomStats[0].occupied_rooms || 0),
          vacant: Number(roomStats[0].vacant_rooms || 0),
          occupancyRate: Math.round(((roomStats[0].occupied_rooms || 0) / (roomStats[0].total_rooms || 7)) * 100),
          floorBreakdown: floorStats
        },
        financials: {
          expectedRevenue: Number(monthFinancials[0].expected_revenue || 0),
          totalCollected: Number(monthFinancials[0].total_collected || 0),
          currentMonthPending: Number(monthFinancials[0].current_month_pending || 0),
          totalPendingDuesAllTime: Number(allTimePending[0].total_pending_dues || 0),
          collectionRate: monthFinancials[0].expected_revenue > 0 
            ? Math.round((Number(monthFinancials[0].total_collected) / Number(monthFinancials[0].expected_revenue)) * 100) 
            : 0
        },
        utilityBatch: utilityBatch[0] || null
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
