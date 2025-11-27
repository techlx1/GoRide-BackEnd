// controllers/profileController.js
import supabase from "../config/supabaseClient.js";

/* ============================================================
   GET CURRENT USER PROFILE
   GET /api/profile/me
   PRIVATE
============================================================ */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, role, date_of_birth, profile_photo_url, created_at"
      )
      .eq("id", userId)
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      profile: data,
    });
  } catch (err) {
    console.error("❌ getUserProfile Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Could not fetch profile",
      error: err.message,
    });
  }
};

/* ============================================================
   UPDATE USER PROFILE
   PUT /api/profile
   PRIVATE
============================================================ */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { full_name, phone, date_of_birth } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!full_name && !phone && !date_of_birth) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    const payload = {
      ...(full_name && { full_name }),
      ...(phone && { phone }),
      ...(date_of_birth && { date_of_birth }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: "Profile updated successfully",
      profile: data,
    });
  } catch (err) {
    console.error("❌ updateProfile Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Could not update profile",
      error: err.message,
    });
  }
};

/* ============================================================
   UPDATE PROFILE PHOTO (Upload to Supabase Storage)
   POST /api/profile/photo
   PRIVATE
============================================================ */
export const updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!req.files || !req.files.photo) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const file = req.files.photo;
    const ext = file.name.split(".").pop();
    const fileName = `profile_photos/${userId}_${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from("profile_photos")
      .upload(fileName, file.data, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadErr) throw uploadErr;

    // Get public URL
    const publicUrl = supabase.storage
      .from("profile_photos")
      .getPublicUrl(fileName).data.publicUrl;

    // Save to DB
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        profile_photo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateErr) throw updateErr;

    return res.json({
      success: true,
      message: "Profile photo updated successfully",
      url: publicUrl,
    });
  } catch (err) {
    console.error("❌ updateProfilePhoto Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to upload profile photo",
      error: err.message,
    });
  }
};
