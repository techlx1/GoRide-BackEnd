import express from "express";
import {
  getDriverProfile,
  getDriverVehicle,
  getDriverDocuments,
  getDriverEarnings,
  getDriverOverview,
} from "../controllers/driverController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 👤 Driver Profile (Unified)
router.get("/profile", verifyToken, getDriverProfile);

// 📊 Overview (alias)
router.get("/overview", verifyToken, getDriverOverview);

// 🚗 Vehicle Info
router.get("/vehicle", verifyToken, getDriverVehicle);

// 📄 Documents
router.get("/documents", verifyToken, getDriverDocuments);

// 💰 Earnings
router.get("/earnings", verifyToken, getDriverEarnings);


export default router;