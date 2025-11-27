import { supabase } from "../server.js";

// 🟢 Create a new ride request (Rider → Driver)
export const createRide = async (req, res) => {
  try {
    const riderId = req.user.id;  // USER MUST COME FROM TOKEN

    const {
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      fare_estimate
    } = req.body;

    if (!pickup_lat || !pickup_lng || !dropoff_lat || !dropoff_lng) {
      return res.status(400).json({
        success: false,
        message: "Pickup and dropoff coordinates are required",
      });
    }

    const { data, error } = await supabase.from("rides").insert([
      {
        rider_id: riderId,
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng,
        fare: fare_estimate || 0,
        status: "pending",
        created_at: new Date(),
      },
    ]).select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Ride created successfully",
      data: data[0],
    });

  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 🔵 Get all rides for logged-in user (Rider or Driver)
export const getAllRides = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .or(`rider_id.eq.${userId},driver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 🟣 Update ride status (accepted, arrived, started, completed, cancelled)
export const updateRideStatus = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const { status, driver_id, vehicle_id } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status required" });
    }

    // Update ride
    const { data, error } = await supabase
      .from("rides")
      .update({
        status,
        driver_id: driver_id || null,
        vehicle_id: vehicle_id || null,
        updated_at: new Date(),
      })
      .eq("ride_id", ride_id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: "Ride status updated",
      data: data[0],
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
