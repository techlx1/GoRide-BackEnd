import { supabase } from "../config/supabaseClient.js";

/*
=================================================================
   CREATE or UPDATE DRIVER VEHICLE
   Supports: multipart/form-data + image upload
=================================================================
*/
export const updateVehicleDetails = async (req, res) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized driver",
      });
    }

    // 🟦 DEBUGGING (TURN ON DURING TESTING)
    console.log("🚗 Incoming Vehicle Body =>", req.body);
    console.log("🖼️ Incoming Vehicle Files =>", req.files);

    // Extract fields from body
    const {
      vehicle_model,
      license_plate,
      vehicle_year,
      vehicle_color,
      vehicle_seats,
    } = req.body;

    // Validate required fields
    if (
      !vehicle_model ||
      !license_plate ||
      !vehicle_year ||
      !vehicle_color ||
      !vehicle_seats
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // =====================================================================
    // 🔵 Upload Vehicle Photo (optional)
    // =====================================================================
    let vehiclePhotoUrl = null;

    if (req.files && req.files.vehicle_photo) {
      const photo = req.files.vehicle_photo;
      const ext = photo.name.split(".").pop();
      const fileName = `vehicles/${driverId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle_photos")
        .upload(fileName, photo.data, {
          upsert: true,
          contentType: photo.mimetype,
        });

      if (uploadError) {
        console.error("❌ Image Upload Error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload vehicle image",
        });
      }

      vehiclePhotoUrl = supabase.storage
        .from("vehicle_photos")
        .getPublicUrl(fileName).data.publicUrl;
    }

    // =====================================================================
    // 🔵 Check if vehicle exists
    // =====================================================================
    const { data: existingVehicle, error: fetchError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("profile_id", driverId)
      .maybeSingle();

    if (fetchError) {
      console.error(fetchError);
      return res.status(500).json({
        success: false,
        message: "Failed to check existing vehicle",
      });
    }

    // =====================================================================
    // 🔵 Build updated payload
    // =====================================================================
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

    let result, saveError;

    // =====================================================================
    // 🔷 UPDATE Existing Vehicle
    // =====================================================================
    if (existingVehicle) {
      ({ data: result, error: saveError } = await supabase
        .from("vehicles")
        .update(payload)
        .eq("profile_id", driverId)
        .select()
        .maybeSingle());
    }
    // =====================================================================
    // 🟢 CREATE Vehicle
    // =====================================================================
    else {
      ({ data: result, error: saveError } = await supabase
        .from("vehicles")
        .insert([
          {
            profile_id: driverId,
            created_at: new Date().toISOString(),
            ...payload,
          },
        ])
        .select()
        .maybeSingle());
    }

    if (saveError) {
      console.error(saveError);
      return res.status(500).json({
        success: false,
        message: "Failed to save vehicle",
        error: saveError.message,
      });
    }

    return res.json({
      success: true,
      message: existingVehicle
        ? "Vehicle updated successfully"
        : "Vehicle created successfully",
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
