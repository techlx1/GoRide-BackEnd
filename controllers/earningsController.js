// controllers/earningsController.js
import { supabase } from "../config/supabaseClient.js";

/**
 * 💰 Get earnings summary for logged-in driver
 * Route: GET /api/driver/earnings
 * Auth: JWT (driver_id extracted from token)
 */
export const getEarningsSummary = async (req, res) => {
  try {
    const driverId = req.user?.id; // ✅ from JWT middleware

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // --------------------------------------------------
    // 1️⃣ Fetch earnings history
    // --------------------------------------------------
    const { data: earningsData, error: earningsError } = await supabase
      .from("earnings")
      .select("amount, date")
      .eq("driver_id", driverId)
      .order("date", { ascending: false })
      .limit(20);

    if (earningsError) throw earningsError;

    // --------------------------------------------------
    // 2️⃣ Date references
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
    // 3️⃣ Completed rides
    // --------------------------------------------------
    const { count: completedRides } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driverId)
      .eq("status", "completed");

    // --------------------------------------------------
    // 4️⃣ Pending payments
    // --------------------------------------------------
    const { count: pendingPayments } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driverId)
      .eq("payment_status", "pending");

    // --------------------------------------------------
    // 5️⃣ FINAL RESPONSE (Flutter-safe)
    // --------------------------------------------------
    return res.status(200).json({
      success: true,
      message: "Earnings summary retrieved successfully",
      data: {
        currency: "GYD",

        // summary
        todayEarnings,
        weekEarnings,
        monthEarnings,
        totalEarnings,

        completedRides: completedRides || 0,
        pendingPayments: pendingPayments || 0,

        // 👇 REQUIRED by Flutter UI
        history: (earningsData || []).map((e) => ({
          date: e.date,
          amount: Number(e.amount) || 0,
        })),

        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("❌ getEarningsSummary Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
