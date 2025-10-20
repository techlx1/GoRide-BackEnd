// controllers/profileController.js
import { pool } from "../models/db.js"; // PostgreSQL pool connection

/**
 * @desc   Get the currently authenticated user's profile
 * @route  GET /api/profile/me
 * @access Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await pool.query(
      "SELECT id, full_name, email, phone, created_at, role FROM profiles WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

/**
 * @desc   Update the authenticated user's profile
 * @route  PUT /api/profile
 * @access Private
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { full_name, phone, date_of_birth } = req.body;

    // Validate at least one field
    if (!full_name && !phone && !date_of_birth) {
      return res
        .status(400)
        .json({ message: "At least one field must be provided for update" });
    }

    const updateFields = [];
    const values = [];
    let index = 1;

    if (full_name) {
      updateFields.push(`full_name = $${index++}`);
      values.push(full_name);
    }
    if (phone) {
      updateFields.push(`phone = $${index++}`);
      values.push(phone);
    }
    if (date_of_birth) {
      updateFields.push(`date_of_birth = $${index++}`);
      values.push(date_of_birth);
    }

    values.push(userId);
    const query = `
      UPDATE profiles
      SET ${updateFields.join(", ")}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING id, full_name, email, phone, date_of_birth, updated_at;
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};
