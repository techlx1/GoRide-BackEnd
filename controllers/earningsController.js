export const getEarningsSummary = async (req, res) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const cacheKey = `driver:earnings:${driverId}`;

    // 1️⃣ Cache (safe)
    let cached = null;
    try {
      cached = await redis.get(cacheKey);
    } catch (_) {}

    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: JSON.parse(cached),
      });
    }

    // 2️⃣ Earnings table (safe)
    const { data: earningsData, error } = await supabase
      .from("earnings")
      .select("amount, date")
      .eq("driver_id", driverId)
      .order("date", { ascending: false })
      .limit(20);

    if (error) throw error;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const weekStart = new Date(new Date().setDate(now.getDate() - 7));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayEarnings = 0,
      weekEarnings = 0,
      monthEarnings = 0,
      totalEarnings = 0;

    earningsData.forEach((e) => {
      const amount = Number(e.amount) || 0;
      const d = new Date(e.date);
      totalEarnings += amount;
      if (d.toISOString().split("T")[0] === todayStr) todayEarnings += amount;
      if (d >= weekStart) weekEarnings += amount;
      if (d >= monthStart) monthEarnings += amount;
    });

    // 3️⃣ Completed rides (safe)
    let completedRides = 0;
    try {
      const { count } = await supabase
        .from("rides")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", driverId)
        .eq("status", "completed");
      completedRides = count || 0;
    } catch (_) {}

    // 4️⃣ Pending payments (safe)
    let pendingPayments = 0;
    try {
      const { count } = await supabase
        .from("rides")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", driverId)
        .eq("payment_status", "pending");
      pendingPayments = count || 0;
    } catch (_) {}

    const summary = {
      currency: "GYD",
      todayEarnings,
      weekEarnings,
      monthEarnings,
      totalEarnings,
      completedRides,
      pendingPayments,
      history: earningsData || [],
      lastUpdated: new Date().toISOString(),
    };

    // 5️⃣ Cache save (safe)
    try {
      await redis.set(cacheKey, JSON.stringify(summary), "EX", 60);
    } catch (_) {}

    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error("❌ Earnings fatal error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
