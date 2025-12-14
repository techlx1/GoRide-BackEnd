// 🌍 Core Dependencies
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import http from "http";

// Config
import pool from "./config/db.js";
import supabase from "./config/supabaseClient.js";

// Socket
import initSocket from "./config/socketInit.js"; // your socket.io initializer
import { initIO } from "./config/socket.js";     // socket singleton

// Routes
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profile.js";
import ridesRoutes from "./routes/rides.js";
import driverRoutes from "./routes/driverRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import appRoutes from "./routes/appRoutes.js";
import notificationsRoutes from "./routes/notifications.js";

dotenv.config();

// ======================================================
// 🚀 Express App
// ======================================================
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
// 📁 File Upload Middleware
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
app.use("/api/driver", driverRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/app", appRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationsRoutes);

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

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
// 🧠 Database Test
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
    res.status(500).json({
      success: false,
      message: "❌ Database connection failed",
      error: error.message,
    });
  }
});

// ======================================================
// 🌐 HTTP SERVER + SOCKET.IO
// ======================================================
const server = http.createServer(app);

// Init socket.io
const io = initSocket(server);

// Register socket globally (for controllers)
initIO(io);

// ======================================================
// ▶️ Start Server
// ======================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 G-Ride Backend running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("🧩 Connected to:", process.env.DATABASE_URL);
});
