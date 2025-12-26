import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

/* ============================================================
   OPTIONAL: REGISTER USER (NON-DRIVER / ADMIN / FUTURE RIDER)
   ============================================================ */
export const registerUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, user_type } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const exists = await pool.query(
      "SELECT id FROM profiles WHERE email = $1 OR phone = $2",
      [email, phone]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO profiles (full_name, email, phone, password, user_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, email, phone, user_type
      `,
      [full_name, email, phone, hashedPassword, user_type || "admin"]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Registration successful",
      token,
      user,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
   DRIVER LOGIN WITH OTP (AUTO-CREATE DRIVER)
   ============================================================ */
export const loginWithOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // 🔍 Check if driver exists
    const q = await pool.query(
      `
      SELECT id, status, profile_completed
      FROM drivers
      WHERE phone = $1
        AND is_deleted = false
      LIMIT 1
      `,
      [phone]
    );

    let driver;
    let type = "EXISTING_DRIVER";

    // 🔥 First-time driver → create pending record
    if (q.rows.length === 0) {
      const insert = await pool.query(
        `
        INSERT INTO drivers (phone, status, profile_completed)
        VALUES ($1, 'pending', false)
        RETURNING id, status, profile_completed
        `,
        [phone]
      );

      driver = insert.rows[0];
      type = "NEW_DRIVER";
    } else {
      driver = q.rows[0];
    }

    // TODO: Send OTP via SMS provider here (Twilio / local gateway)

    return res.json({
      success: true,
      message: "OTP sent",
      type,
      driverId: driver.id,
      status: driver.status,
      profile_completed: driver.profile_completed,
    });
  } catch (err) {
    console.error("OTP login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
   VERIFY OTP + ISSUE TOKEN
   ============================================================ */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    // ⚠️ TEMP OTP CHECK (replace with real OTP verification)
    if (otp !== "123456") {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const q = await pool.query(
      `
      SELECT id, status, profile_completed
      FROM drivers
      WHERE phone = $1
        AND is_deleted = false
      LIMIT 1
      `,
      [phone]
    );

    const driver = q.rows[0];

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    const token = jwt.sign(
      { id: driver.id, user_type: "driver" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      driver: {
        id: driver.id,
        status: driver.status,
        profile_completed: driver.profile_completed,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
   PASSWORD RESET (PLACEHOLDERS)
   ============================================================ */
export const requestPasswordReset = async (req, res) => {
  res.json({ success: true, message: "OTP sent (mock)" });
};

export const verifyPasswordReset = async (req, res) => {
  res.json({ success: true, message: "Password reset (mock)" });
};
