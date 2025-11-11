import { supabase } from "../server.js";
import supabase from "../config/supabaseClient.js";


// 🟢 Update driver coordinates
export const updateDriverLocation = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { latitude, longitude } = req.body;

    const { data, error } = await supabase
      .from("driver_status")
      .upsert(
        {
          driver_id: driverId,
          current_latitude: latitude,
          current_longitude: longitude,
          last_updated: new Date(),
        },
        { onConflict: "driver_id" }
      );

    if (error) throw error;
    res.json({ success: true, message: "Driver location updated", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 🟣 Set driver online/offline
export const setOnlineStatus = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { is_online } = req.body;

    const { data, error } = await supabase
      .from("driver_status")
      .upsert(
        {
          driver_id: driverId,
          is_online,
          last_updated: new Date(),
        },
        { onConflict: "driver_id" }
      );

    if (error) throw error;
    res.json({ success: true, message: "Driver status updated", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 🔵 Get all currently online drivers
export const getOnlineDrivers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("driver_status")
      .select("driver_id, current_latitude, current_longitude, last_updated")
      .eq("is_online", true);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
