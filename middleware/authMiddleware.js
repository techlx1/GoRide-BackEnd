import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
      });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid Authorization format",
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔒 Fetch user from DB to validate status
    const q = await pool.query(
      `
      SELECT id, email, user_type, is_deleted
      FROM profiles
      WHERE id = $1
      LIMIT 1
      `,
      [decoded.id]
    );

    const user = q.rows[0];

    // ❌ User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found",
      });
    }

    // ❌ User soft-deleted
    if (user.is_deleted) {
      return res.status(403).json({
        success: false,
        message: "Account has been deleted",
      });
    }

    // ✅ Attach verified user
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_type,
    };

    next();
  } catch (error) {
    console.error("❌ JWT Verification Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or unauthorized token",
    });
  }
};
