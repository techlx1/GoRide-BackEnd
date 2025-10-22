import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import ridesRoutes from "./routes/rides.js";
import driverStatusRoutes from "./routes/driverStatus.js";
import driverRoutes from "./routes/driver.js";



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
app.use("/api/driver-status", driverStatusRoutes);
app.use("/api/driver", driverRoutes);

// 🩵 Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to G-Ride Backend 🚗" });
});

// 🧩 Debug route to list all registered endpoints
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

  res.json({ routes });
});

// 🖥️ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
