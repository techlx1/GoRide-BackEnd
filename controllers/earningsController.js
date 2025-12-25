// controllers/earningsController.js
import { supabase } from "../config/supabaseClient.js";
import redis from "../config/redisClient.js";

/**
 * 💰 Get earnings summary for logged-in driver
 * Route: GET /api/driver/earnings
 * Auth: JWT
 */
export const getEarningsSummary = async (req, res) => {
  const driverId = req.user?.id;
  if (!driverId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const cacheKey = `driver:earnings:${driverId}`;

  try {
    /* ============================================================
       1️⃣ READ FROM CACHE (NON-BLOCKING)
    ============================================================ */
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          success: true,
          cached: true,
          data: JSON.parse(cached),
        });
      }
    } catch (err) {
      console.warn("⚠️ Redis read failed, bypassing cache");
    }

    /* ============================================================
       2️⃣ FETCH EARNINGS HISTORY
    ============================================================ */
    const { data: earningsRows, error: earningsError } = await supabase
      .from("earnings")
      .select("amount, date")
      .eq("driver_id", driverId)
      .order("date", { ascending: false })
      .limit(20);

    if (earningsError) throw earningsError;

    /* ============================================================
       3️⃣ CALCULATE TOTALS
    ============================================================ */
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekStart = new Date(new Date().setDate(now.getDate() - 7));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;
    let totalEarnings = 0;

    for (const row of earningsRows ?? []) {
      const amount = Number(row.amount) || 0;
      const rowDate = new Date(row.date);
      const rowDateStr = rowDate.toISOString().slice(0, 10);

      totalEarnings += amount;
      if (rowDateStr === todayStr) todayEarnings += amount;
      if (rowDate >= weekStart) weekEarnings += amount;
      if (rowDate >= monthStart) monthEarnings += amount;
    }

    /* ============================================================
       4️⃣ COMPLETED RIDES (SAFE QUERY)
    ============================================================ */
    let completedRides = 0;
    try {
      const { count } = await supabase
        .from("rides")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", driverId)
        .eq("status", "completed");

      completedRides = count || 0;
    } catch {
      console.warn("⚠️ completed rides query failed");
    }

    /* ============================================================
       5️⃣ PENDING PAYMENTS (OPTIONAL COLUMN)
    ============================================================ */
    let pendingPayments = 0;
    try {
      const { count } = await supabase
        .from("rides")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", driverId)
        .eq("payment_status", "pending");

      pendingPayments = count || 0;
    } catch {
      console.warn("⚠️ payment_status column missing or blocked");
    }

    /* ============================================================
       6️⃣ FINAL RESPONSE OBJECT
    ============================================================ */
    const summary = {
      currency: "GYD",

      todayEarnings,
      weekEarnings,
      monthEarnings,
      totalEarnings,

      completedRides,
      pendingPayments,

      history: (earningsRows ?? []).map((e) => ({
        date: e.date,
        amount: Number(e.amount) || 0,
      })),

      lastUpdated: new Date().toISOString(),
    };

    /* ============================================================
       7️⃣ WRITE TO CACHE (NON-BLOCKING)
    ============================================================ */
    try {
      await redis.set(cacheKey, JSON.stringify(summary), "EX", 60);
    } catch {
      console.warn("⚠️ Redis write failed");
    }

    return res.status(200).json({
      success: true,
      cached: false,
      data: summary,
    });
  } catch (err) {
    console.error("❌ Earnings controller error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
