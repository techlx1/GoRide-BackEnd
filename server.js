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
import { initSocket } from "./config/socket.js";

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
// 🔧 Base Middlewares (FAST)
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

// ======================================================
// 🩺 Health Check (IMPORTANT FOR RENDER)
// ======================================================
app.get("/health", (_, res) => res.status(200).send("OK"));

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
// 🌐 HTTP SERVER
// ======================================================
const server = http.createServer(app);

// ======================================================
// ▶️ START SERVER FIRST (CRITICAL)
// ======================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 G-Ride Backend running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "production"}`);
});

// ======================================================
// 🔌 INIT SOCKET.IO AFTER SERVER IS LISTENING
// ======================================================
initSocket(server);
console.log("🔌 Socket.IO initialized");

// ======================================================
// 🧠 CONNECT DB IN BACKGROUND (NON-BLOCKING)
// ======================================================
(async () => {
  try {
    const client = await pool.connect();
    console.log("🧩 Connected to:", process.env.DATABASE_URL);
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
})();
