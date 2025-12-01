import { supabase } from "../config/supabaseClient.js";

/*
==============================================================
  🗑 DELETE DRIVER ACCOUNT (Soft Delete)
==============================================================
*/
export const deleteDriverAccount = async (req, res) => {
  try {
    const driverId = req.user?.id;

    if (!driverId)
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });

    // Check driver exists
    const { data: profile, error: fetchErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", driverId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (!profile)
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });

    // Perform soft delete
    const { error: deleteErr } = await supabase
      .from("profiles")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", driverId);

    if (deleteErr) throw deleteErr;

    // OPTIONAL: Disable driver vehicle + documents
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
        "Your account has been scheduled for deletion. You will be logged out.",
    });
  } catch (err) {
    console.error("deleteDriverAccount Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: err.message,
    });
  }
};
