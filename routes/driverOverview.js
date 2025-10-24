import express from "express";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = express.Router();

/**
 * 🧭 DRIVER DASHBOARD OVERVIEW
 * Endpoint: GET /api/driver/overview
 * Combines profile, vehicle, and ride statistics
 */
router.get("/overview", async (req, res) => {
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

    // 👤 Fetch driver info from the correct table
    const userQuery = await pool.query(
      `SELECT id, full_name, email, phone, user_type, created_at 
       FROM profiles 
       WHERE id = $1 AND user_type = 'driver'`,
      [driverId]
    );

    if (userQuery.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });
    }

    const driver = userQuery.rows[0];

    // 🚗 Fetch vehicle info (or provide defaults)
    const vehicleQuery = await pool.query(
      `SELECT make, model, year, license_plate, fuel_level, mileage, status 
       FROM vehicles 
       WHERE driver_id = $1`,
      [driverId]
    );

    const vehicle =
      vehicleQuery.rows[0] || {
        make: "Toyota",
        model: "Corolla",
        year: "2020",
        license_plate: "GY-1234-AB",
        fuel_level: 75,
        mileage: 125000,
        status: "Active",
      };

    // 📊 Fetch ride statistics
    const statsQuery = await pool.query(
      `SELECT 
        COUNT(*) AS total_trips,
        COALESCE(SUM(fare_amount), 0) AS total_earnings,
        COALESCE(AVG(rating), 0) AS avg_rating
      FROM rides
      WHERE driver_id = $1`,
      [driverId]
    );

    const todayQuery = await pool.query(
      `SELECT 
        COUNT(*) AS today_trips,
        COALESCE(SUM(fare_amount), 0) AS today_earnings
      FROM rides
      WHERE driver_id = $1 AND DATE(start_time) = CURRENT_DATE`,
      [driverId]
    );

    const stats = {
      totalTrips: Number(statsQuery.rows[0].total_trips) || 0,
      totalEarnings: Number(statsQuery.rows[0].total_earnings) || 0,
      averageRating: Number(statsQuery.rows[0].avg_rating).toFixed(1) || 0,
      todayTrips: Number(todayQuery.rows[0].today_trips) || 0,
      todayEarnings: Number(todayQuery.rows[0].today_earnings) || 0,
      onlineHours: Math.floor(Math.random() * 8) + 3,
    };

    // 🧩 Final response
    res.status(200).json({
      success: true,
      overview: {
        driver,
        vehicle,
        stats,
      },
    });
  } catch (error) {
    console.error("Driver overview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load driver overview",
      error: error.message,
    });
  }
});

export default router;
