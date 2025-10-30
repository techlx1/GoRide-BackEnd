import express from "express";
import jwt from "jsonwebtoken";
import pool from "../../config/db.js";

const router = express.Router();

/**
 * 🚘 DRIVER EARNINGS & STATS
 * @route   GET /api/driver/earnings
 * @desc    Returns today and weekly earnings summary
 * @access  Private (Driver)
 */
router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid authorization token",
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const driverId = decoded.id;

    // 🚕 Daily stats
    const dailyQuery = `
      SELECT 
        COUNT(*)::INT AS trips_completed,
        COALESCE(SUM(fare_amount), 0)::FLOAT AS total_earnings,
        COALESCE(AVG(rating), 0)::FLOAT AS avg_rating
      FROM rides
      WHERE driver_id = $1
      AND DATE(start_time) = CURRENT_DATE
    `;
    const { rows: [daily] } = await pool.query(dailyQuery, [driverId]);

    // 📆 Weekly stats
    const weeklyQuery = `
      SELECT 
        COUNT(*)::INT AS weekly_trips,
        COALESCE(SUM(fare_amount), 0)::FLOAT AS weekly_earnings
      FROM rides
      WHERE driver_id = $1
      AND start_time >= NOW() - INTERVAL '7 days'
    `;
    const { rows: [weekly] } = await pool.query(weeklyQuery, [driverId]);

    // 🕒 Simulated working hours placeholder
    const hoursWorked = Math.floor(Math.random() * 8) + 4;

    const stats = {
      todayEarnings: daily.total_earnings || 0,
      tripsCompleted: daily.trips_completed || 0,
      averageRating: parseFloat(daily.avg_rating?.toFixed(1)) || 0,
      hoursWorked,
      weeklyEarnings: weekly.weekly_earnings || 0,
      weeklyTrips: weekly.weekly_trips || 0,
    };

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("❌ Earnings Stats Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error: failed to load ride statistics",
    });
  }
});

export default router;
