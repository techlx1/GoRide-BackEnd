import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../server.js";

export const registerUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, user_type } = req.body;

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

    res.status(201).json({ success: true, message: "User registered successfully", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) throw new Error("User not found");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new Error("Invalid credentials");

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
