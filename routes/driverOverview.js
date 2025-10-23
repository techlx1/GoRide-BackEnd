import express from "express";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = express.Router();

/**
 * 🚘 DRIVER DASHBOARD OVERVIEW
 * Combines: Profile + Vehicle + Earnings Stats
 * Endpoint: GET /api/driver/overview
 * Requires: Bearer token (JWT)
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

    // 👤 Fetch driver profile
    const userQuery = await pool.query(
      "SELECT id, full_name, email, phone, user_type, created_at FROM users WHERE id = $1",
      [driverId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    const driver = userQuery.rows[0];

    // 🚗 Fetch vehicle info
    const vehicleQuery = await pool.query(
      "SELECT make, model, year, license_plate, fuel_level, mileage, status FROM vehicles WHERE driver_id = $1",
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

    // 💰 Fetch ride stats
    const statsQuery = await pool.query(
      `SELECT 
        COUNT(*) AS trips_completed,
        COALESCE(SUM(fare_amount), 0) AS total_earnings,
        COALESCE(AVG(rating), 0) AS avg_rating
      FROM rides
      WHERE driver_id = $1
      AND start_time >= NOW() - INTERVAL '7 days'`,
      [driverId]
    );

    const stats = statsQuery.rows[0];

    const overview = {
      profile: {
        id: driver.id,
        full_name: driver.full_name,
        email: driver.email,
        phone: driver.phone,
        user_type: driver.user_type,
        created_at: driver.created_at,
      },
      vehicle,
      stats: {
        weeklyTrips: Number(stats.trips_completed) || 0,
        weeklyEarnings: Number(stats.total_earnings) || 0,
        averageRating: Number(stats.avg_rating).toFixed(1) || 0,
        hoursWorked: Math.floor(Math.random() * 8) + 4,
      },
    };

    return res.status(200).json({
      success: true,
      overview,
    });
  } catch (error) {
    console.error("Driver Overview Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch driver overview",
    });
  }
});

export default router;
