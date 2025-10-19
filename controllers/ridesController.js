import { supabase } from "../server.js";

export const createRide = async (req, res) => {
  try {
    const { rider_id, driver_id, pickup, destination, fare_amount, status } = req.body;

    const { data, error } = await supabase.from("rides").insert([
      {
        rider_id,
        driver_id,
        pickup,
        destination,
        fare_amount,
        status: status || "pending",
        created_at: new Date(),
      },
    ]);

    if (error) throw error;

    res.status(201).json({ success: true, ride: data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getRides = async (req, res) => {
  try {
    const { data, error } = await supabase.from("rides").select("*");
    if (error) throw error;

    res.status(200).json({ success: true, rides: data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateRideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("rides")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, ride: data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
