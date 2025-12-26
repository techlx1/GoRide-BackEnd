// controllers/driverController.js
import { supabase } from "../config/supabaseClient.js";

/**
 * 👤 GET DRIVER PROFILE
 * GET /api/driver/profile
 */
export const getDriverProfile = async (req, res) => {
  try {
    const driverId = req.user.id;

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        avatar_url,
        user_type,
        created_at
      `)
      .eq("id", driverId)
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("❌ getDriverProfile:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * 📊 DRIVER OVERVIEW (NO EARNINGS)
 * GET /api/driver/overview
 */
export const getDriverOverview = async (req, res) => {
  try {
    const driverId = req.user.id;

    // Recent rides
    const { data: rides } = await supabase
      .from("rides")
      .select("id, pickup_address, dropoff_address, status, created_at")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false })
      .limit(5);

    return res.json({
      success: true,
      data: {
        recentRides: rides || [],
      },
    });
  } catch (err) {
    console.error("❌ getDriverOverview:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * 🚗 DRIVER VEHICLE
 * GET /api/driver/vehicle
 */
export const getDriverVehicle = async (req, res) => {
  try {
    const driverId = req.user.id;

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", driverId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return res.json({
      success: true,
      data: data || null,
    });
  } catch (err) {
    console.error("❌ getDriverVehicle:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * 📄 DRIVER DOCUMENTS
 * GET /api/driver/documents
 */
export const getDriverDocuments = async (req, res) => {
  try {
    const driverId = req.user.id;

    const { data, error } = await supabase
      .from("driver_documents")
      .select("*")
      .eq("driver_id", driverId);

    if (error) throw error;

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (err) {
    console.error("❌ getDriverDocuments:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ✏️ UPDATE DRIVER PROFILE
 * PUT /api/driver/profile
 */
export const updateDriverProfile = async (req, res) => {
  try {
    const driverId = req.user.id;
    const updates = req.body;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", driverId);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("❌ updateDriverProfile:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
