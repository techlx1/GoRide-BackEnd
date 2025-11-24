// controllers/authController.js
import supabase from "../config/supabaseClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ================================
   🟦 LOGIN CONTROLLER
   ================================ */
export const loginUser = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone and password are required",
      });
    }

    const queryField = emailOrPhone.includes("@") ? "email" : "phone";

    // 1️⃣ Get user from database
    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq(queryField, emailOrPhone)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2️⃣ Validate password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // 3️⃣ Create JWT token
    const token = jwt.sign(
      { id: user.id, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    console.error("LoginError:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
