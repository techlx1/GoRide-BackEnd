// routes/driverOverview.js
import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/**
 * 🚗 DRIVER DASHBOARD OVERVIEW
 * Temporary public version (no JWT) — will be secured later.
 * GET /api/driver/overview/:driverId
 */
router.get("/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: "Driver ID is required",
      });
    }

    /* ============================================================
       1️⃣ DRIVER INFO
    ============================================================ */
    const driverResult = await pool.query(
      `
      SELECT id, full_name, email, phone, user_type, created_at 
      FROM profiles 
      WHERE id = $1 AND user_type = 'driver'
      `,
      [driverId]
    );

    if (driverResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    const driver = driverResult.rows[0];

    /* ============================================================
       2️⃣ VEHICLE INFO
    ============================================================ */
    const vehicleResult = await pool.query(
      `
      SELECT make, model, year, license_plate, fuel_level, mileage, status 
      FROM vehicles 
      WHERE driver_id = $1
      `,
      [driverId]
    );

    const vehicle =
      vehicleResult.rows[0] || {
        make: "Toyota",
        model: "Axio",
        year: "2018",
        license_plate: "PWW-2345",
        fuel_level: 65,
        mileage: 85000,
        status: "Active",
      };

    /* ============================================================
       3️⃣ STATS (total + today)
    ============================================================ */
    const [statsResult, todayResult] = await Promise.all([
      pool.query(
        `
        SELECT 
          COUNT(*) AS total_trips,
          COALESCE(SUM(fare_amount), 0) AS total_earnings,
          COALESCE(AVG(rating), 0) AS avg_rating
        FROM rides
        WHERE driver_id = $1
        `,
        [driverId]
      ),
      pool.query(
        `
        SELECT 
          COUNT(*) AS today_trips,
          COALESCE(SUM(fare_amount), 0) AS today_earnings
        FROM rides
        WHERE driver_id = $1 AND DATE(start_time) = CURRENT_DATE
        `,
        [driverId]
      ),
    ]);

    const stats = {
      totalTrips: Number(statsResult.rows[0].total_trips) || 0,
      totalEarnings: Number(statsResult.rows[0].total_earnings) || 0,
      averageRating: parseFloat(statsResult.rows[0].avg_rating || 0).toFixed(1),
      todayTrips: Number(todayResult.rows[0].today_trips) || 0,
      todayEarnings: Number(todayResult.rows[0].today_earnings) || 0,
      onlineHours: Math.floor(Math.random() * 8) + 3, // placeholder for real tracking
    };

    /* ============================================================
       ✅ SUCCESS RESPONSE
    ============================================================ */
    return res.status(200).json({
      success: true,
      overview: {
        driver,
        vehicle,
        stats,
      },
    });
  } catch (error) {
    console.error("❌ Driver Overview Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load driver overview",
      error: error.message,
    });
  }
});

export default router;
