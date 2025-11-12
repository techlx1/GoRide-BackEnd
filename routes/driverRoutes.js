// routes/driverRoutes.js
import express from "express";
import {
  getDriverProfile,
  getDriverVehicle,
  getDriverDocuments,
  getDriverEarnings,
  getDriverOverview, // ✅ kept for backward compatibility
} from "../controllers/driverController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 👤 DRIVER PROFILE
 * GET /api/driver/profile
 * Returns driver profile + vehicle + documents + stats + earnings
 */
router.get("/profile", verifyToken, getDriverProfile);

/**
 * 📊 DRIVER OVERVIEW (alias)
 * GET /api/driver/overview
 * Returns same data as /profile for older app versions
 */
router.get("/overview", verifyToken, getDriverOverview);

/**
 * 🚗 VEHICLE INFO
 * GET /api/driver/vehicle
 * Returns driver's vehicle details (model, plate, year)
 */
router.get("/vehicle", verifyToken, getDriverVehicle);

/**
 * 📄 DOCUMENT STATUS
 * GET /api/driver/documents
 * Returns driver's uploaded/verified document info
 */
router.get("/documents", verifyToken, getDriverDocuments);

/**
 * 💰 EARNINGS
 * GET /api/driver/earnings
 * Returns list of all earnings by date
 */
router.get("/earnings", verifyToken, getDriverEarnings);

export default router;
