import pool from "../config/db.js";
import { getIO } from "../config/socket.js";

export const updateDriverStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, reason } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const allowed = new Set(["approved", "rejected"]);
    if (!allowed.has(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const result = await pool.query(
      `
      UPDATE drivers
      SET status = $1,
          rejection_reason = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING id, status
      `,
      [status, reason || null, driverId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // 🔔 Notify driver
    const title =
      status === "approved"
        ? "Account Approved 🎉"
        : "Account Rejected";

    const message =
      status === "approved"
        ? "Your driver account has been approved. You can now go online."
        : reason
          ? `Your account was rejected. Reason: ${reason}`
          : "Your account was rejected. Please update your information.";

    await pool.query(
      `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, 'driver_status')
      `,
      [driverId, title, message]
    );

    try {
      const io = getIO();
      io.to(`driver_${driverId}`).emit("notification", {
        title,
        message,
        type: "driver_status",
        created_at: new Date().toISOString(),
      });
    } catch {}

    return res.json({
      success: true,
      message: "Driver status updated",
      driver: result.rows[0],
    });
  } catch (error) {
    console.error("Update Driver Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update driver status",
    });
  }
};
