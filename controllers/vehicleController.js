import { supabase } from "../config/supabaseClient.js";

export const updateVehicleDetails = async (req, res) => {
  try {
    const profileId = req.user.id; // UUID from token

    const {
      vehicle_model,
      license_plate,
      vehicle_year,
      vehicle_color,
      vehicle_seats,
    } = req.body;

    if (!vehicle_model || !license_plate || !vehicle_year || !vehicle_color || !vehicle_seats) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // --------------------------
    // 🔵 Upload Vehicle Photo
    // --------------------------
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

    // --------------------------
    // 🔵 Check if vehicle exists
    // --------------------------
    const { data: existingVehicle, error: checkError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (checkError) throw checkError;

    // --------------------------
    // 🔵 Payload
    // --------------------------
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

    let result, error;

    if (existingVehicle) {
      // 🔵 UPDATE
      ({ data: result, error } = await supabase
        .from("vehicles")
        .update(payload)
        .eq("profile_id", profileId)
        .select()
        .maybeSingle());
    } else {
      // 🟢 INSERT (CREATE)
      ({ data: result, error } = await supabase
        .from("vehicles")
        .insert([
          {
            profile_id: profileId,
            created_at: new Date().toISOString(),
            ...payload,
          },
        ])
        .select()
        .maybeSingle());
    }

    if (error) throw error;

    return res.json({
      success: true,
      message: existingVehicle ? "Vehicle updated successfully" : "Vehicle created successfully",
      vehicle: result,
    });

  } catch (error) {
    console.error("Vehicle Update Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
