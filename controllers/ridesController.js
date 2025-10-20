import { supabase } from "../server.js";

// 🟢 Create a new ride
export const createRide = async (req, res) => {
  try {
    const { rider_id, pickup_location, dropoff_location, fare_amount } = req.body;

    const { data, error } = await supabase.from("rides").insert([
      {
        rider_id,
        pickup_location,
        dropoff_location,
        fare_amount,
        status: "pending",
      },
    ]);

    if (error) throw error;
    res.status(201).json({ success: true, message: "Ride created successfully", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 🔵 Get all rides for logged-in user
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

// 🟣 Update ride status
export const updateRideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("rides")
      .update({ status, updated_at: new Date() })
      .eq("id", id)
      .select();

    if (error) throw error;
    res.json({ success: true, message: "Ride status updated", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
