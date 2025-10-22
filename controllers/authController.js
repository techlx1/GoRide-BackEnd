import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../server.js";

// ✅ Register new user
export const registerUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, user_type } = req.body;

    if (!email && !phone)
      return res.status(400).json({ success: false, message: "Email or phone required." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase.from("profiles").insert([
      {
        full_name,
        email,
        phone,
        password: hashedPassword,
        user_type,
        created_at: new Date(),
      },
    ]);

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: data[0],
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ✅ Login user (email OR phone)
export const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone)
      return res.status(400).json({ success: false, message: "Email or phone required." });

    const query = email
      ? supabase.from("profiles").select("*").eq("email", email).single()
      : supabase.from("profiles").select("*").eq("phone", phone).single();

    const { data: user, error } = await query;

    if (error || !user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
