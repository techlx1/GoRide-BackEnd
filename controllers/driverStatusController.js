import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

import {
  updateDriverStatus,
  updateDriverLocation,
  setOnlineStatus,
  getOnlineDrivers
} from "../controllers/driverStatusController.js";

const router = express.Router();

/*
=========================================================
 DRIVER STATUS ROUTES
=========================================================
*/

// 🔵 Update online/offline + location + trip state (UPSERT)
router.post("/update", verifyToken, updateDriverStatus);

// 🔵 Update ONLY location (optional endpoint)
router.post("/location", verifyToken, updateDriverLocation);

// 🔵 Toggle online/offline (optional endpoint)
router.post("/online", verifyToken, setOnlineStatus);

// 🟢 Get all available (online + not in trip) drivers
router.get("/online", getOnlineDrivers);

export default router;
