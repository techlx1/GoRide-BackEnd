// controllers/settingsController.js
import db from "../config/db.js"; // adjust if your db file is in a different place

// ---------------------------------------------------------
// 💬 1. SUBMIT APP SUGGESTION
// ---------------------------------------------------------
export const submitSuggestion = async (req, res) => {
  try {
    const { driver_id, message } = req.body;

    if (!driver_id || !message) {
      return res.status(400).json({
        success: false,
        message: "driver_id and message are required",
      });
    }

    const query = `
      INSERT INTO app_suggestions (driver_id, message)
      VALUES ($1, $2)
      RETURNING id, driver_id, message, created_at
    `;

    const result = await db.query(query, [driver_id, message]);

    return res.status(200).json({
      success: true,
      message: "Suggestion submitted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Submit Suggestion Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error submitting suggestion",
    });
  }
};

// ---------------------------------------------------------
// ⚙️ 2. UPDATE ACCOUNT SETTINGS (example only)
// ---------------------------------------------------------
export const updateSettings = async (req, res) => {
  try {
    const { driver_id, dark_mode, language } = req.body;

    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: "driver_id is required",
      });
    }

    const query = `
      UPDATE driver_settings
      SET dark_mode = $2,
          language = $3,
          updated_at = NOW()
      WHERE driver_id = $1
      RETURNING *
    `;

    const result = await db.query(query, [
      driver_id,
      dark_mode ?? false,
      language ?? "en",
    ]);

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update Settings Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating settings",
    });
  }
};

// ---------------------------------------------------------
// 🔔 3. UPDATE NOTIFICATION SETTINGS
// ---------------------------------------------------------
export const updateNotificationSettings = async (req, res) => {
  try {
    const { driver_id, push_enabled, sms_enabled, email_enabled } = req.body;

    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: "driver_id is required",
      });
    }

    const query = `
      UPDATE notification_settings
      SET push_enabled = $2,
          sms_enabled = $3,
          email_enabled = $4,
          updated_at = NOW()
      WHERE driver_id = $1
      RETURNING *
    `;

    const result = await db.query(query, [
      driver_id,
      push_enabled ?? true,
      sms_enabled ?? false,
      email_enabled ?? false,
    ]);

    res.status(200).json({
      success: true,
      message: "Notification settings updated",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Notification Settings Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating notifications",
    });
  }
};
