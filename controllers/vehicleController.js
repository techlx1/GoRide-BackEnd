import { supabase } from "../config/supabaseClient.js";

// 🟢 Create/Update vehicle
export const updateVehicleDetails = async (req, res) => {
  try {
    const profileId = req.user.id; // UUID from token

    const {
      vehicle_model,
      license_plate,
      vehicle_year,
      vehicle_color,
      vehicle_seats
    } = req.body;

    if (
      !vehicle_model ||
      !license_plate ||
      !vehicle_year ||
      !vehicle_color ||
      !vehicle_seats
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // 🔵 VEHICLE PHOTO UPLOAD
    let vehiclePhotoUrl = null;

    if (req.files && req.files.vehicle_photo) {
      const photo = req.files.vehicle_photo;
      const ext = photo.name.split(".").pop();
      const fileName = `vehicles/${profileId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle_photos")
        .upload(fileName, photo.data, {
          contentType: photo.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload vehicle image",
        });
      }

      vehiclePhotoUrl = supabase.storage
        .from("vehicle_photos")
        .getPublicUrl(fileName).data.publicUrl;
    }

    // 🔵 Check if vehicle already exists
    const { data: existing, error: fetchError } = await supabase
      .from("vehicles")
      .select("vehicle_id, vehicle_photo")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const payload = {
      vehicle_model,
      license_plate,
      vehicle_year,
      vehicle_color,
      vehicle_seats: Number(vehicle_seats),
      updated_at: new Date().toISOString(),
    };

    if (vehiclePhotoUrl) {
      payload.vehicle_photo = vehiclePhotoUrl;
    }

    let result;
    let error;

    if (existing) {
      // 🔵 UPDATE VEHICLE (UPSERT)
      ({ data: result, error } = await supabase
        .from("vehicles")
        .update(payload)
        .eq("profile_id", profileId)
        .select()
        .maybeSingle());
    } else {
      // 🟢 CREATE NEW VEHICLE
      ({ data: result, error } = await supabase
        .from("vehicles")
        .insert([
          {
            profile_id: profileId,
            ...payload,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .maybeSingle());
    }

    if (error) throw error;

    return res.json({
      success: true,
      message: existing ? "Vehicle updated successfully" : "Vehicle created successfully",
      vehicle: result
    });

  } catch (error) {
    console.error("Vehicle Update Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};
