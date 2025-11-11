import express from "express";
import jwt from "jsonwebtoken";
import supabase from "../config/supabaseClient.js"; // ✅ Correct path

const router = express.Router();

/**
 * 💰 DRIVER EARNINGS SUMMARY
 * @route   GET /api/driver/earnings/:driverId
 * @desc    Returns total, weekly, and today’s earnings from Supabase
 * @access  Private (Driver)
 */
router.get("/:driverId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid authorization token",
      });
    }

    // 🧩 Verify JWT token
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

    const driverId = req.params.driverId || decoded.id;

    // ✅ Supabase RPC or table query (fallback)
    const { data, error } = await supabase
      .from("earnings")
      .select("amount, date")
      .eq("driver_id", driverId);

    if (error) throw new Error(error.message);

    // 🧮 Calculate totals
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    let total = 0,
      todaySum = 0,
      weekSum = 0,
      monthSum = 0;

    data.forEach((e) => {
      const amount = e.amount || 0;
      const entryDate = new Date(e.date);
      total += amount;
      if (e.date === today.toISOString().split("T")[0]) todaySum += amount;
      if (entryDate >= weekStart) weekSum += amount;
      if (entryDate >= monthStart) monthSum += amount;
    });

    return res.status(200).json({
      success: true,
      earnings: {
        today: todaySum,
        week: weekSum,
        month: monthSum,
        total,
        currency: "GYD",
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Earnings Route Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error: failed to load driver earnings",
      error: error.message,
    });
  }
});

export default router;
