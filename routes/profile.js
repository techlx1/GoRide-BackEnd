import express from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

/**
 * 👤 Fetch Logged-in User Profile (via Supabase)
 * @route   GET /api/profile/me
 * @access  Private (Bearer JWT)
 */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid token",
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

    const userId = decoded.id;

    // ✅ Fetch profile from Supabase users table
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, phone, user_type, created_at")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ Supabase error:", error.message);
      return res
        .status(400)
        .json({ success: false, message: "Failed to fetch profile." });
    }

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("❌ Profile Route Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message,
    });
  }
});

export default router;
