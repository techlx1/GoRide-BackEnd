// controllers/driverController.js
import supabase from "../config/supabaseClient.js";

/**
 * 🚗 Get full driver profile — including vehicle + documents
 */
export const getDriverProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // Query all tables in parallel
    const [driver, vehicle, documents] = await Promise.all([
      supabase.from("drivers").select("*").eq("id", userId).single(),
      supabase.from("vehicles").select("*").eq("driver_id", userId).single(),
      supabase.from("driver_documents").select("*").eq("driver_id", userId),
    ]);

    if (driver.error) throw driver.error;
    if (vehicle.error) throw vehicle.error;
    if (documents.error) throw documents.error;

    return res.json({
      success: true,
      driver: driver.data,
      vehicle: vehicle.data,
      documents: documents.data,
    });
  } catch (err) {
    console.error("❌ getDriverProfile Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 🚘 Get only vehicle info
 */
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

    res.json({ success: true, vehicle: data });
  } catch (err) {
    console.error("❌ getDriverVehicle Error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};
