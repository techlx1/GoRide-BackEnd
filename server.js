import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Route Imports
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import ridesRoutes from "./routes/rides.js";
import driverStatusRoutes from "./routes/driverStatus.js";
import driverRoutes from "./routes/driver.js";
import driverOverviewRoutes from "./routes/driverOverview.js";


// 🌍 Environment setup
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// 🌐 Initialize Supabase Client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🧩 Attach Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/rides", ridesRoutes);
app.use("/api/driver-status", driverStatusRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/driver", driverOverviewRoutes);


// 🩵 Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to G-Ride Backend 🚗" });
});

// 🧭 Debug endpoint — shows all registered API paths
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

  res.json({ success: true, total: routes.length, routes });
});

// 🖥️ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
