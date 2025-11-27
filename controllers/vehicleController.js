export const uploadVehiclePhoto = async (req, res) => {
  try {
    if (!req.files || !req.files.vehicle_photo) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    const photo = req.files.vehicle_photo;
    const ext = photo.name.split(".").pop();
    const fileName = `vehicles/${req.user.id}_${Date.now()}.${ext}`;

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

    const url = supabase.storage
      .from("vehicle_photos")
      .getPublicUrl(fileName).data.publicUrl;

    return res.json({
      success: true,
      url,
    });

  } catch (err) {
    console.error("Upload Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};
