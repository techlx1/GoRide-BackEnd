// controllers/driverController.js
import { supabase } from "../server.js";

// 🚗 Get vehicle details for the logged-in driver
export const getDriverVehicle = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

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
