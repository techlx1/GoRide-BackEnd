// controllers/driverOverviewController.js
import supabase from "../config/supabaseClient.js";

/**
 * 🧭 Get driver overview: stats, earnings, and ratings
 * Route: GET /api/driver/overview
 */
export const getDriverOverview = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Missing user token" });
    }

    // 1️⃣ Fetch total completed trips
    const { count: totalTrips, error: tripsError } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", userId)
      .eq("status", "completed");

    if (tripsError) throw tripsError;

    // 2️⃣ Fetch today's earnings
    const today = new Date().toISOString().split("T")[0];
    const { data: todayEarningsData, error: earningsError } = await supabase
      .from("earnings")
      .select("amount")
      .eq("driver_id", userId)
      .gte("date", today);

    if (earningsError) throw earningsError;

    const todayEarnings = todayEarningsData?.reduce(
      (sum, row) => sum + (row.amount || 0),
      0
    );

    // 3️⃣ Fetch average rating
    const { data: ratingData, error: ratingError } = await supabase
      .from("ratings")
      .select("rating")
      .eq("driver_id", userId);

    if (ratingError) throw ratingError;

    const averageRating =
      ratingData.length > 0
        ? (
            ratingData.reduce((sum, row) => sum + row.rating, 0) /
            ratingData.length
          ).toFixed(1)
        : 0;

    // 4️⃣ Hours worked (from completed trips total duration)
    const { data: rideDurations, error: durationError } = await supabase
      .from("rides")
      .select("duration_minutes")
      .eq("driver_id", userId)
      .eq("status", "completed");

    if (durationError) throw durationError;

    const totalMinutes = rideDurations.reduce(
      (sum, row) => sum + (row.duration_minutes || 0),
      0
    );
    const hoursWorked = (totalMinutes / 60).toFixed(1);

    // ✅ Build response object
    const overview = {
      tripsCompleted: totalTrips || 0,
      todayEarnings: todayEarnings || 0,
      averageRating: Number(averageRating),
      hoursWorked: Number(hoursWorked),
      status: "online",
      lastUpdated: new Date().toISOString(),
    };

    return res.json({
      success: true,
      message: "Driver overview retrieved successfully",
      overview,
    });
  } catch (err) {
    console.error("❌ getDriverOverview Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch driver overview",
      error: err.message,
    });
  }
};
