// routes/driverRoutes.js
import express from "express";
import {
  getDriverProfile,
  getDriverVehicle,
  getDriverDocuments,
  getDriverOverview,
  getDriverEarnings,
} from "../controllers/driverController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 👤 DRIVER PROFILE
 * GET /api/driver/profile
 * Returns driver profile info (name, email, phone, etc.)
 */
router.get("/profile", verifyToken, getDriverProfile);

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
 * 📊 OVERVIEW
 * GET /api/driver/overview
 * Returns trips completed, ratings, earnings today, etc.
 */
router.get("/overview", verifyToken, getDriverOverview);

/**
 * 💰 EARNINGS
 * GET /api/driver/earnings
 * Returns daily, weekly, monthly, and total earnings
 */
router.get("/earnings", verifyToken, getDriverEarnings);

export default router;
