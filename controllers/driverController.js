// controllers/driverController.js
import supabase from "../config/supabaseClient.js";

/* ============================================================
   👤 1. Get Driver Profile
   ============================================================ */
export const getDriverProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, user_type, created_at")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return res.json({ success: true, profile: data });
  } catch (err) {
    console.error("❌ getDriverProfile Error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch driver profile" });
  }
};

/* ============================================================
   🚘 2. Get Driver Vehicle Details
   ============================================================ */
export const getDriverVehicle = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", userId)
      .single();

    if (error) throw error;

    return res.json({ success: true, vehicle: data });
  } catch (err) {
    console.error("❌ getDriverVehicle Error:", err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

/* ============================================================
   📄 3. Get Driver Document Status
   ============================================================ */
export const getDriverDocuments = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { data, error } = await supabase
      .from("driver_documents")
      .select("*")
      .eq("driver_id", userId);

    if (error) throw error;

    return res.json({
      success: true,
      documents: data || [],
    });
  } catch (err) {
    console.error("❌ getDriverDocuments Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ============================================================
   📊 4. Driver Overview (Trips, Hours, Rating, Earnings)
   ============================================================ */
export const getDriverOverview = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // Completed trips
    const { count: totalTrips } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", userId)
      .eq("status", "completed");

    // Today's earnings
    const today = new Date().toISOString().split("T")[0];
    const { data: earningsToday } = await supabase
      .from("earnings")
      .select("amount")
      .eq("driver_id", userId)
      .eq("date", today);

    const todayEarnings =
      earningsToday?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    // Average rating
    const { data: ratingData } = await supabase
      .from("ratings")
      .select("rating")
      .eq("driver_id", userId);

    const averageRating =
      ratingData?.length > 0
        ? (
            ratingData.reduce((sum, r) => sum + r.rating, 0) /
            ratingData.length
          ).toFixed(1)
        : 0;

    // Hours worked
    const { data: rideDurations } = await supabase
      .from("rides")
      .select("duration_minutes")
      .eq("driver_id", userId)
      .eq("status", "completed");

    const totalMinutes =
      rideDurations?.reduce(
        (sum, r) => sum + (r.duration_minutes || 0),
        0
      ) || 0;
    const hoursWorked = (totalMinutes / 60).toFixed(1);

    return res.json({
      success: true,
      overview: {
        tripsCompleted: totalTrips || 0,
        todayEarnings,
        averageRating: Number(averageRating),
        hoursWorked: Number(hoursWorked),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("❌ getDriverOverview Error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch driver overview" });
  }
};

/* ============================================================
   💰 5. Driver Earnings Summary
   ============================================================ */
export const getDriverEarnings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const { data: earningsData, error } = await supabase
      .from("earnings")
      .select("amount, date")
      .eq("driver_id", userId);

    if (error) throw error;

    let total = 0,
      todaySum = 0,
      weekSum = 0,
      monthSum = 0;

    earningsData.forEach((entry) => {
      const amount = entry.amount || 0;
      const entryDate = new Date(entry.date);
      total += amount;
      if (entry.date === today.toISOString().split("T")[0]) todaySum += amount;
      if (entryDate >= weekStart) weekSum += amount;
      if (entryDate >= monthStart) monthSum += amount;
    });

    return res.json({
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
  } catch (err) {
    console.error("❌ getDriverEarnings Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch driver earnings",
      error: err.message,
    });
  }
};
