// FILE: FULLY FIXED loginUser CONTROLLER (copy/paste this)

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

/**
 * 🔐 Login with email or phone
 * Fully Fixed Version – G-Ride Backend
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

    let userQuery;

    // 🔍 Search by email
    if (email) {
      userQuery = await pool.query(
        "SELECT * FROM public.profiles WHERE email = $1 LIMIT 1",
        [email.trim().toLowerCase()]
      );
    }

    // 🔍 Search by phone
    if (!email && phone) {
      userQuery = await pool.query(
        "SELECT * FROM public.profiles WHERE phone = $1 LIMIT 1",
        [phone.trim()]
      );
    }

    const user = userQuery?.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔑 Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // 🎫 Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🎉 Success response
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
