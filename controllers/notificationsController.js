import pool from "../config/db.js";

/**
 * GET /api/notifications
 * Get all notifications for logged-in user
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.json({
      success: true,
      notifications: result.rows,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
};

/**
 * GET /api/notifications/unread-count
 * Number of unread notifications
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT COUNT(*) 
      FROM notifications
      WHERE user_id = $1 AND is_read = false
      `,
      [userId]
    );

    return res.json({
      success: true,
      unreadCount: Number(result.rows[0].count),
    });
  } catch (error) {
    console.error("Unread Count Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread count.",
    });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark one notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read.",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error("Mark Read Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
    });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1
      `,
      [userId]
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all as read.",
    });
  }
};
