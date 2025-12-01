import { supabase } from "../config/supabaseClient.js";


/*
==============================================================
  DRIVER PROFILE – Unified Response
==============================================================
*/
export const getDriverProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, user_type, created_at")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("make, model, year, license_plate, status")
      .eq("driver_id", userId)
      .maybeSingle();

    const { data: documents } = await supabase
      .from("driver_documents")
      .select("type, status, uploaded_at")
      .eq("driver_id", userId);

    const { count: totalTrips } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", userId)
      .eq("status", "completed");

    const today = new Date().toISOString().split("T")[0];

    const { data: earningsToday } = await supabase
      .from("earnings")
      .select("amount")
      .eq("driver_id", userId)
      .eq("date", today);

    const todayEarnings =
      earningsToday?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

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

    const { data: earningsData } = await supabase
      .from("earnings")
      .select("amount, date")
      .eq("driver_id", userId);

    let total = 0,
      weekSum = 0,
      monthSum = 0;
    const todayDate = new Date();
    const weekStart = new Date(todayDate);
    weekStart.setDate(todayDate.getDate() - 7);
    const monthStart = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth(),
      1
    );

    earningsData?.forEach((entry) => {
      const amount = entry.amount || 0;
      const entryDate = new Date(entry.date);

      total += amount;
      if (entryDate >= weekStart) weekSum += amount;
      if (entryDate >= monthStart) monthSum += amount;
    });

    return res.json({
      success: true,
      profile,
      vehicle: vehicle || {},
      documents: documents || [],
      stats: {
        tripsCompleted: totalTrips || 0,
        todayEarnings,
        averageRating: Number(averageRating),
        hoursWorked: Number(hoursWorked),
      },
      earnings: {
        today: todayEarnings,
        week: weekSum,
        month: monthSum,
        total,
      },
    });
  } catch (err) {
    console.error("❌ getDriverProfile Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch driver profile",
      error: err.message,
    });
  }
};

/*
==============================================================
  VEHICLE
==============================================================
*/
export const getDriverVehicle = async (req, res) => {
  try {
    const userId = req.user?.id;

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", userId)
      .single();

    if (error) throw error;

    res.json({ success: true, vehicle: data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/*
==============================================================
  DOCUMENTS
==============================================================
*/
export const getDriverDocuments = async (req, res) => {
  try {
    const userId = req.user?.id;

    const { data, error } = await supabase
      .from("driver_documents")
      .select("*")
      .eq("driver_id", userId);

    if (error) throw error;

    res.json({ success: true, documents: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDriverOverview = getDriverProfile;

/*
==============================================================
  EARNINGS
==============================================================
*/
export const getDriverEarnings = async (req, res) => {
  try {
    const userId = req.user?.id;

    const { data, error } = await supabase
      .from("earnings")
      .select("amount, date, ride_id")
      .eq("driver_id", userId);

    if (error) throw error;

    res.json({ success: true, earnings: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
