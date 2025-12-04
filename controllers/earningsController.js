// controllers/earningsController.js
import { supabase } from "../config/supabaseClient.js";

/**
 * 💰 Get earnings summary for a specific driver
 * Route: GET /api/driver/earnings/:driverId
 */
export const getEarningsSummary = async (req, res) => {
  try {
    const driverId = req.params.driverId;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: "Driver ID is required",
      });
    }

    // 1️⃣ Fetch earnings for the driver
    const { data: earningsData, error: earningsError } = await supabase
      .from("earnings")
      .select("amount, date")
      .eq("driver_id", driverId);

    if (earningsError) throw earningsError;

    if (!earningsData || earningsData.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No earnings found",
        data: {
          driver_id: driverId,
          totalEarnings: 0,
          todayEarnings: 0,
          weekEarnings: 0,
          monthEarnings: 0,
          completedRides: 0,
          pendingPayments: 0,
          currency: "GYD",
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    // 2️⃣ Date References
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 3️⃣ Summary counters
    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;
    let totalEarnings = 0;

    earningsData.forEach((entry) => {
      const amount = Number(entry.amount) || 0;
      const entryDate = new Date(entry.date);

      totalEarnings += amount;
      if (entry.date === todayStr) todayEarnings += amount;
      if (entryDate >= weekStart) weekEarnings += amount;
      if (entryDate >= monthStart) monthEarnings += amount;
    });

    // 4️⃣ Completed rides count
    const { count: completedRides, error: ridesError } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driverId)
      .eq("status", "completed");

    if (ridesError) throw ridesError;

    // 5️⃣ Pending payments count
    const { count: pendingPayments, error: pendingError } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driverId)
      .eq("payment_status", "pending");

    if (pendingError) throw pendingError;

    // 6️⃣ Final structured summary
    const summary = {
      driver_id: driverId,
      currency: "GYD",
      totalEarnings,
      todayEarnings,
      weekEarnings,
      monthEarnings,
      completedRides: completedRides || 0,
      pendingPayments: pendingPayments || 0,
      lastUpdated: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      message: "Earnings summary retrieved successfully",
      data: summary,
    });
  } catch (err) {
    console.error("❌ getEarningsSummary Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
