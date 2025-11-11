// controllers/earningsController.js
import supabase from "../config/supabaseClient.js";

/**
 * 💰 Get earnings summary for a specific driver
 * Route: GET /api/driver/earnings/:driverId
 */
export const getEarningsSummary = async (req, res) => {
  try {
    const driverId = req.params.driverId;

    if (!driverId) {
      return res
        .status(400)
        .json({ success: false, message: "Driver ID is required" });
    }

    // 1️⃣ Fetch all earnings for the driver
    const { data: earningsData, error: earningsError } = await supabase
      .from("earnings")
      .select("amount, date")
      .eq("driver_id", driverId);

    if (earningsError) throw earningsError;

    if (!earningsData || earningsData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No earnings data found for this driver",
      });
    }

    // 2️⃣ Compute total and breakdowns
    const today = new Date().toISOString().split("T")[0];
    const weekStart = new Date();
    weekStart.setDate(new Date().getDate() - 7);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;
    let totalEarnings = 0;

    earningsData.forEach((entry) => {
      const amount = entry.amount || 0;
      const date = new Date(entry.date);
      totalEarnings += amount;
      if (entry.date === today) todayEarnings += amount;
      if (date >= weekStart) weekEarnings += amount;
      if (date >= monthStart) monthEarnings += amount;
    });

    // 3️⃣ Fetch total completed rides
    const { count: completedRides, error: ridesError } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driverId)
      .eq("status", "completed");

    if (ridesError) throw ridesError;

    // 4️⃣ Fetch pending payments (rides without payment confirmed)
    const { count: pendingPayments, error: pendingError } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driverId)
      .eq("payment_status", "pending");

    if (pendingError) throw pendingError;

    // ✅ Format final summary
    const summary = {
      driver_id: driverId,
      totalEarnings,
      todayEarnings,
      weekEarnings,
      monthEarnings,
      completedRides: completedRides || 0,
      pendingPayments: pendingPayments || 0,
      currency: "GYD",
      lastUpdated: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      message: "Earnings summary retrieved successfully",
      data: summary,
    });
  } catch (err) {
    console.error("❌ getEarningsSummary Error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
