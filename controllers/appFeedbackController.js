import { supabase } from "../config/supabaseClient.js";

/*
==============================================================
  📩 SUBMIT APP SUGGESTION
==============================================================
*/
export const submitAppSuggestion = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { subject, message, category, device_info, app_version } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    // Insert into app_feedback table
    const { data, error } = await supabase.from("app_feedback").insert([
      {
        user_id: userId,
        user_type: "driver",
        subject,
        message,
        category: category || "general",
        device_info: device_info || null,
        app_version: app_version || null,
      },
    ]);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Thank you for your suggestion! We will review it shortly.",
    });
  } catch (err) {
    console.error("submitAppSuggestion Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to submit suggestion",
      error: err.message,
    });
  }
};
