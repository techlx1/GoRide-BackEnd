import express from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

/**
 * 🚘 DRIVER EARNINGS & STATS
 * @route   GET /api/drivers/:id/earnings
 * @desc    Returns today and weekly earnings summary from Supabase
 * @access  Private (Driver)
 */
router.get("/:id/earnings", async (req, res) => {
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

    const driverId = req.params.id || decoded.id;

    // ✅ Use Supabase RPC for consistent results
    const { data, error } = await supabase.rpc("get_driver_earnings", {
      driver_id: driverId,
    });

    if (error) {
      console.error("❌ Supabase RPC Error:", error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      earnings: data,
    });
  } catch (error) {
    console.error("❌ Earnings Route Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error: failed to load driver earnings",
    });
  }
});

export default router;
