import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

/**
 * 🧍 Register new user
 */
export const registerUser = async (req, res) => {
  try {
    console.log("📩 Incoming registration data:", req.body);

    const { full_name, email, phone, password, user_type } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // 🧩 Check for duplicate email or phone
    const existing = await pool.query(
      "SELECT * FROM public.profiles WHERE email = $1 OR phone = $2",
      [email, phone]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email or phone number",
      });
    }

    // 🔒 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧠 Insert new user
    const result = await pool.query(
      `INSERT INTO public.profiles (full_name, email, phone, password, user_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, user_type`,
      [full_name, email, phone, hashedPassword, user_type || "rider"]
    );

    const user = result.rows[0];

    // 🎫 Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user,
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    return res.status(500).json({
      success: false,
      message: `Server error during registration: ${error.message}`,
    });
  }
};

/**
 * 🔐 Login with email or phone
 */
export const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or phone and password are required",
      });
    }

    // 🔍 Find user
    const userQuery = await pool.query(
      "SELECT * FROM public.profiles WHERE email = $1 OR phone = $2",
      [email, phone]
    );

    const user = userQuery.rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 🔑 Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    // 🎫 Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Return token + user data
    return res.status(200).json({
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
  } catch (error) {
    console.error("❌ Login Error:", error);
    return res.status(500).json({
      success: false,
      message: `Login failed: ${error.message}`,
    });
  }
};

/**
 * 🔑 Request password reset (mock for now)
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Email or phone required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("🔢 OTP generated:", otp);

    // TODO: Send OTP via email or SMS service (Twilio/Mailgun)
    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully", otp });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to send reset code" });
  }
};

/**
 * ✅ Verify OTP and reset password (mock for now)
 */
export const verifyPasswordReset = async (req, res) => {
  try {
    const { email, phone, otp, newPassword } = req.body;
    if (!otp || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "OTP and new password required" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("🔐 Password reset for:", email || phone);

    // TODO: Save hashed password to DB (when real OTP validation is implemented)
    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully (mock)" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to reset password" });
  }
};
