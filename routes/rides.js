import express from "express";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = express.Router();

/**
 * 🚘 DRIVER EARNINGS & STATS ENDPOINT
 * Endpoint: GET /api/rides/stats
 * Requires: Bearer Token (JWT)
 */
router.get("/stats", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid authorization token",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const driverId = decoded.id;

    // 🚕 Fetch daily stats from rides table
    const dailyStatsQuery = await pool.query(
      `SELECT 
        COUNT(*) AS trips_completed,
        COALESCE(SUM(fare_amount), 0) AS total_earnings,
        COALESCE(AVG(rating), 0) AS avg_rating
      FROM rides
      WHERE driver_id = $1
      AND DATE(start_time) = CURRENT_DATE`,
      [driverId]
    );

    const dailyStats = dailyStatsQuery.rows[0];

    // 🗓 Weekly stats
    const weeklyStatsQuery = await pool.query(
      `SELECT 
        COUNT(*) AS weekly_trips,
        COALESCE(SUM(fare_amount), 0) AS weekly_earnings
      FROM rides
      WHERE driver_id = $1
      AND start_time >= NOW() - INTERVAL '7 days'`,
      [driverId]
    );

    const weeklyStats = weeklyStatsQuery.rows[0];

    // 🕒 Simulated working hours (can later link to tracking)
    const hoursWorked = Math.floor(Math.random() * 8) + 4;

    // 📊 Build summary response
    const stats = {
      todayEarnings: Number(dailyStats.total_earnings) || 0,
      tripsCompleted: Number(dailyStats.trips_completed) || 0,
      averageRating: Number(dailyStats.avg_rating).toFixed(1) || 0,
      hoursWorked,
      weeklyEarnings: Number(weeklyStats.weekly_earnings) || 0,
      weeklyTrips: Number(weeklyStats.weekly_trips) || 0,
    };

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load ride statistics",
    });
  }
});

export default router;
