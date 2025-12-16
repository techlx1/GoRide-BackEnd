import pool from "../config/db.js";
import { supabase } from "../config/supabaseClient.js";

/* ============================================================================
   1. DRIVER DASHBOARD OVERVIEW (POSTGRESQL)
============================================================================ */
export const getDriverOverview = async (req, res) => {
  try {
    const driverId = req.user.id;

    /* --- DRIVER INFO --- */
    const driverResult = await pool.query(
      `SELECT id, full_name, email, phone, user_type, created_at
       FROM profiles 
       WHERE id = $1 AND user_type = 'driver'`,
      [driverId]
    );

    if (driverResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    const driver = driverResult.rows[0];

    /* --- VEHICLE INFO --- */
    const vehicleResult = await pool.query(
      `SELECT make, model, year, license_plate, fuel_level, mileage, status
       FROM vehicles WHERE driver_id = $1`,
      [driverId]
    );

    const vehicle = vehicleResult.rows[0] || {};

    /* --- TRIP STATS --- */
    const [statsResult, todayResult] = await Promise.all([
      pool.query(
        `SELECT 
          COUNT(*) AS total_trips,
          COALESCE(SUM(fare_amount),0) AS total_earnings,
          COALESCE(AVG(rating),0) AS avg_rating
         FROM rides WHERE driver_id = $1`,
        [driverId]
      ),
      pool.query(
        `SELECT 
          COUNT(*) AS today_trips,
          COALESCE(SUM(fare_amount),0) AS today_earnings
         FROM rides
         WHERE driver_id = $1 AND DATE(start_time)=CURRENT_DATE`,
        [driverId]
      ),
    ]);

    const stats = {
      totalTrips: Number(statsResult.rows[0].total_trips || 0),
      totalEarnings: Number(statsResult.rows[0].total_earnings || 0),
      averageRating: Number(statsResult.rows[0].avg_rating || 0).toFixed(1),
      todayTrips: Number(todayResult.rows[0].today_trips || 0),
      todayEarnings: Number(todayResult.rows[0].today_earnings || 0),
    };

    return res.status(200).json({
      success: true,
      overview: { driver, vehicle, stats },
    });
  } catch (err) {
    console.error("❌ getDriverOverview error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

/* ============================================================================
   2. GET DRIVER PROFILE (Supabase)
============================================================================ */
export const getDriverProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    /* --- Profile Core --- */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, user_type, created_at, gender, date_of_birth"
      )
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    /* --- Vehicle --- */
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("make, model, year, license_plate, status")
      .eq("driver_id", userId)
      .maybeSingle();

    /* --- Documents --- */
    const { data: documents } = await supabase
      .from("driver_documents")
      .select("doc_type, status, uploaded_at, file_url")
      .eq("driver_id", userId);

    /* --- Completed Trips --- */
    const { count: totalTrips } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", userId)
      .eq("status", "completed");

    /* --- Today Earnings --- */
    const today = new Date().toISOString().split("T")[0];

    const { data: earningsToday } = await supabase
      .from("earnings")
      .select("amount")
      .eq("driver_id", userId)
      .eq("date", today);

    const todayEarnings =
      earningsToday?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    /* --- Ratings --- */
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

    /* --- Hours Worked --- */
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

    /* --- Earnings Aggregates --- */
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

/* ============================================================================
   3. GET VEHICLE
============================================================================ */
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

/* ============================================================================
   4. DOCUMENTS
============================================================================ */
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

/* ============================================================================
   5. UPDATE DRIVER PROFILE
============================================================================ */
export const updateDriverProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    const {
      full_name,
      phone,
      email,
      gender,
      date_of_birth
    } = req.body;

    const payload = {
      full_name,
      phone,
      email,
      gender,
      date_of_birth,
      updated_at: new Date(),
    };

    Object.keys(payload).forEach((key) => {
      if (!payload[key]) delete payload[key];
    });

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      profile: data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: err.message,
    });
  }
};

/* ============================================================================
   6. DRIVER EARNINGS (simple list)
============================================================================ */
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
/*
==============================================================
  EARNINGS SUMMARY  ⭐ NEW ⭐
==============================================================
*/
export const getEarningsSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all earnings for driver
    const { data: earningsData, error } = await supabase
      .from("earnings")
      .select("amount, date")
      .eq("driver_id", userId);

    if (error) throw error;

    let todaySum = 0,
        weekSum = 0,
        monthSum = 0,
        total = 0;

    earningsData?.forEach((entry) => {
      const amount = entry.amount || 0;
      const entryDate = new Date(entry.date);

      total += amount;

      if (entry.date === today) todaySum += amount;
      if (entryDate >= weekStart) weekSum += amount;
      if (entryDate >= monthStart) monthSum += amount;
    });

    return res.json({
      success: true,
      earningsSummary: {
        today: todaySum,
        week: weekSum,
        month: monthSum,
        total,
      },
    });
  } catch (err) {
    console.error("❌ getEarningsSummary Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch earnings summary",
      error: err.message,
    });
  }
};
/*
==============================================================
  Recent Order
==============================================================
*/
export const getRecentOrders = async (req, res) => {
  try {
    const driverId = req.user.id;

    const result = await db.query(
      `
      SELECT
        id,
        pickup_address,
        dropoff_address,
        fare_amount,
        distance_km,
        duration_min,
        status,
        created_at
      FROM rides
      WHERE driver_id = $1
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [driverId]
    );

    return res.json({
      success: true,
      rides: result.rows,
    });
  } catch (error) {
    console.error('❌ Recent orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching recent orders',
    });
  }
};
