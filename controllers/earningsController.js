// controllers/earningsController.js
import { supabase } from "../config/supabaseClient.js";
import redis from "../config/redisClient.js";

/**
 * 💰 Get earnings summary for logged-in driver
 * Route: GET /api/driver/earnings
 * Auth: JWT
 */
export const getEarningsSummary = async (req, res) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const cacheKey = `driver:earnings:${driverId}`;

    // --------------------------------------------------
    // 1️⃣ CHECK CACHE (FAST PATH)
    // --------------------------------------------------
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        cached: true,
        message: "Earnings summary retrieved (cached)",
        data: JSON.parse(cached),
      });
    }

    // --------------------------------------------------
    // 2️⃣ FETCH EARNINGS HISTORY
    // --------------------------------------------------
    const { data: earningsData, error: earningsError } = await supabase
      .from("earnings")
      .select("amount, date")
      .eq("driver_id", driverId)
      .order("date", { ascending: false })
      .limit(20);

    if (earningsError) throw earningsError;

    // --------------------------------------------------
    // 3️⃣ DATE REFERENCES
    // --------------------------------------------------
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;
    let totalEarnings = 0;

    (earningsData || []).forEach((entry) => {
      const amount = Number(entry.amount) || 0;
      const entryDate = new Date(entry.date);
      const entryDay = entryDate.toISOString().split("T")[0];

      totalEarnings += amount;
      if (entryDay === todayStr) todayEarnings += amount;
      if (entryDate >= weekStart) weekEarnings += amount;
      if (entryDate >= monthStart) monthEarnings += amount;
    });

    // --------------------------------------------------
    // 4️⃣ COMPLETED RIDES
    // --------------------------------------------------
    const { count: completedRides } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driverId)
      .eq("status", "completed");

    // --------------------------------------------------
    // 5️⃣ PENDING PAYMENTS
    // --------------------------------------------------
    const { count: pendingPayments } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driverId)
      .eq("payment_status", "pending");

    // --------------------------------------------------
    // 6️⃣ FINAL DATA OBJECT
    // --------------------------------------------------
    const summary = {
      currency: "GYD",

      todayEarnings,
      weekEarnings,
      monthEarnings,
      totalEarnings,

      completedRides: completedRides || 0,
      pendingPayments: pendingPayments || 0,

      history: (earningsData || []).map((e) => ({
        date: e.date,
        amount: Number(e.amount) || 0,
      })),

      lastUpdated: new Date().toISOString(),
    };

    // --------------------------------------------------
    // 7️⃣ SAVE TO CACHE (60s TTL)
    // --------------------------------------------------
    await redis.set(
      cacheKey,
      JSON.stringify(summary),
      "EX",
      60 // seconds
    );

    return res.status(200).json({
      success: true,
      cached: false,
      message: "Earnings summary retrieved successfully",
      data: summary,
    });
  } catch (err) {
    console.error("❌ getEarningsSummary Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
