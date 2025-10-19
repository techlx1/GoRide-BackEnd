import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import ridesRoutes from "./routes/rides.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// 🌍 Initialize Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🧩 Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/rides", ridesRoutes);

// 🩵 Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to G-Ride Backend 🚗" });
});

// 🖥️ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
