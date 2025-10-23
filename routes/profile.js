import express from "express";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = express.Router();

/**
 * 👤 Fetch Logged-in User Profile
 * Endpoint: GET /api/profile/me
 * Requires: Bearer token (JWT) in Authorization header
 */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userQuery = await pool.query(
      "SELECT id, full_name, email, phone, user_type, created_at FROM users WHERE id = $1",
      [decoded.id]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userQuery.rows[0];

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
});

export default router;
