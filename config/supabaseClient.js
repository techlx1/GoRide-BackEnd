// controllers/driverController.js
import supabase from "../config/supabaseClient.js";

/**
 * 🚗 Get vehicle details for the logged-in driver
 * Route: GET /api/driver/vehicle
 * Middleware: verifyToken (must attach req.user)
 */
export const getDriverVehicle = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Missing user token" });
    }

    // Fetch the vehicle associated with this driver
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", userId)
      .maybeSingle(); // ✅ safer than .single(), avoids crash if no vehicle found

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No vehicle record found for this driver",
      });
    }

    return res.json({
      success: true,
      message: "Vehicle retrieved successfully",
      vehicle: data,
    });
  } catch (err) {
    console.error("❌ getDriverVehicle Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve vehicle data",
      error: err.message,
    });
  }
};
