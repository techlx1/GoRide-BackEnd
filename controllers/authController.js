import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

/**
 * REGISTER USER
 */
export const registerUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, user_type } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const exists = await pool.query(
      "SELECT id FROM profiles WHERE email = $1 OR phone = $2",
      [email, phone]
    );

    if (exists.rows.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO profiles (full_name, email, phone, password, user_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, user_type`,
      [full_name, email, phone, hashedPassword, user_type || "rider"]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
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

/**
 * LOGIN USER
 */
export const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing email/phone or password" });
    }

    const field = email ? "email" : "phone";
    const value = email ? email.toLowerCase() : phone;

    const q = await pool.query(
      `SELECT * FROM profiles WHERE ${field} = $1 LIMIT 1`,
      [value]
    );

    const user = q.rows[0];
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        user_type: user.user_type,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * REQUEST PASSWORD RESET (mock)
 */
export const requestPasswordReset = async (req, res) => {
  res.json({ success: true, message: "OTP sent (mock)" });
};

/**
 * VERIFY PASSWORD RESET (mock)
 */
export const verifyPasswordReset = async (req, res) => {
  res.json({ success: true, message: "Password reset (mock)" });
};
