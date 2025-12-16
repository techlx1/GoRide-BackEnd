import { supabase } from "../config/supabaseClient.js";

/*
==============================================================
  🗑 DELETE DRIVER ACCOUNT (Soft Delete)
==============================================================
*/
export const deleteDriverAccount = async (req, res) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check driver exists
    const { data: profile, error: fetchErr } = await supabase
      .from("profiles")
      .select("id, is_deleted")
      .eq("id", driverId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Already deleted
    if (profile.is_deleted) {
      return res.status(400).json({
        success: false,
        message: "Account already deleted",
      });
    }

    // ✅ SOFT DELETE (THIS WAS MISSING)
    const { error: deleteErr } = await supabase
      .from("profiles")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", driverId);

    if (deleteErr) throw deleteErr;

    // Optional: deactivate related data
    await supabase
      .from("vehicles")
      .update({ status: "inactive" })
      .eq("driver_id", driverId);

    await supabase
      .from("driver_documents")
      .update({ status: "inactive" })
      .eq("driver_id", driverId);

    return res.json({
      success: true,
      message:
        "Your account has been deleted. You will no longer be able to log in.",
    });
  } catch (err) {
    console.error("deleteDriverAccount Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};
