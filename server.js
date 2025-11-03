// 🌍 Core Dependencies
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import pool from "./config/db.js"; // PostgreSQL Pool

// 🌍 Environment setup
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// 🌐 Initialize Supabase Client (optional - for storage/auth)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🧩 Route Imports (make sure these files exist in /routes)
import auth from "./routes/auth.js";
import profile from "./routes/profile.js";
import rides from "./routes/rides.js";
import driverStatus from "./routes/driverStatus.js";
import driver from "./routes/driver.js";
import driverOverview from "./routes/driverOverview.js";
import earningsRoutes from "./routes/earningsRoutes.js";

// 🧩 Attach Routes
app.use("/api/auth", auth);
app.use("/api/profile", profile);
app.use("/api/rides", rides);
app.use("/api/driver-status", driverStatus);
app.use("/api/driver", driver);
app.use("/api/driver/overview", driverOverview);
app.use("/api/driver/earnings", earningsRoutes);

// 🩵 Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚗 Welcome to G-Ride Backend API",
    environment: process.env.NODE_ENV || "development",
  });
});

// 🧠 Quick Database Connection Test
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      message: "✅ PostgreSQL connected successfully!",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    res.status(500).json({
      success: false,
      message: "❌ Database connection failed",
      error: error.message,
    });
  }
});

// 🧭 Debug Endpoint — Lists all Active API Routes
app.get("/api/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path,
      });
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach((handler) => {
        const route = handler.route;
        if (route) {
          routes.push({
            method: Object.keys(route.methods)[0].toUpperCase(),
            path: route.path,
          });
        }
      });
    }
  });
  res.json({
    success: true,
    totalRoutes: routes.length,
    routes,
  });
});

// 🖥️ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 G-Ride Backend running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("🧩 Connected to:", process.env.DATABASE_URL);
});
