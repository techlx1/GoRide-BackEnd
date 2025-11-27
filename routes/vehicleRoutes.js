import db from "../config/db.js";
import { supabase } from "../config/supabaseClient.js";

export const updateVehicleDetails = async (req, res) => {
  try {
    const profileId = req.user.id; // UUID

    const {
      vehicle_model,
      license_plate,
      vehicle_year,
      vehicle_color,
      vehicle_seats
    } = req.body;

    if (!vehicle_model || !license_plate || !vehicle_year || !vehicle_color || !vehicle_seats) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Upload vehicle photo if exists
    let vehiclePhotoUrl = null;

    if (req.files && req.files.vehicle_photo) {
      const photo = req.files.vehicle_photo;
      const ext = photo.name.split(".").pop();
      const filename = `vehicles/${profileId}_${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("vehicle_photos")
        .upload(filename, photo.data, {
          contentType: photo.mimetype
        });

      if (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Image upload failed" });
      }

      vehiclePhotoUrl = supabase.storage
        .from("vehicle_photos")
        .getPublicUrl(filename).data.publicUrl;
    }

    const result = await db.query(
      `
      INSERT INTO vehicles (
        profile_id, vehicle_model, license_plate, vehicle_year,
        vehicle_color, vehicle_seats, vehicle_photo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (profile_id) DO UPDATE SET
        vehicle_model = EXCLUDED.vehicle_model,
        license_plate = EXCLUDED.license_plate,
        vehicle_year = EXCLUDED.vehicle_year,
        vehicle_color = EXCLUDED.vehicle_color,
        vehicle_seats = EXCLUDED.vehicle_seats,
        vehicle_photo = COALESCE(EXCLUDED.vehicle_photo, vehicles.vehicle_photo),
        updated_at = NOW()
      RETURNING *;
      `,
      [
        profileId,
        vehicle_model,
        license_plate,
        vehicle_year,
        vehicle_color,
        vehicle_seats,
        vehiclePhotoUrl
      ]
    );

    return res.json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle: result.rows[0]
    });

  } catch (error) {
    console.error("Vehicle Update Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
