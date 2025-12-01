// 🌍 Core Dependencies
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";   // ⭐ ADDED
import pool from "./config/db.js";
import supabase from "./config/supabaseClient.js";

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profile.js";
import ridesRoutes from "./routes/rides.js";
import driverStatusRoutes from "./routes/driverStatus.js";
import driverRoutes from "./routes/driverRoutes.js";
import driverOverviewRoutes from "./routes/driverOverview.js";
import driverEarningsRoutes from "./routes/driverEarnings.js";
import debugRoutes from "./routes/debugRoutes.js";

dotenv.config();

const app = express();

// ======================================================
// 🔧 Base Middlewares
// ======================================================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// ⭐ IMPORTANT: File Upload Middleware (Fixes Your Error)
// ======================================================
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./tmp",
    createParentPath: true,
  })
);

// ======================================================
// 🧩 API Routes
// ======================================================
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/rides", ridesRoutes);
app.use("/api/driver-status", driverStatusRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/driver/overview", driverOverviewRoutes);
app.use("/api/driver/earnings", driverEarningsRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/app", appRoutes);

// ======================================================
// 🩵 Root Route
// ======================================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚗 Welcome to G-Ride Backend API",
    environment: process.env.NODE_ENV || "development",
  });
});

// ======================================================
// 🧠 Quick Database Test
// ======================================================
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

// ======================================================
// 🧭 Debug Route — List All Registered Routes
// ======================================================
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
  res.json({ success: true, totalRoutes: routes.length, routes });
});

// ======================================================
// 🖥️ Start Server
// ======================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 G-Ride Backend running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("🧩 Connected to:", process.env.DATABASE_URL);
});
