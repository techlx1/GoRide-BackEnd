import express from "express";
import {
  getDriverProfile,
  getDriverOverview,
  getDriverVehicle,
  getDriverDocuments,
  getDriverEarnings,
} from "../controllers/driverController.js";

import { updateVehicleDetails } from "../controllers/vehicleController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================
   DRIVER PROFILE / OVERVIEW
============================================================ */
router.get("/profile", verifyToken, getDriverProfile);
router.get("/overview", verifyToken, getDriverOverview);

/* ============================================================
   VEHICLE
============================================================ */
router.get("/vehicle", verifyToken, getDriverVehicle);

// 🟢 Create or update vehicle (multipart/form-data)
router.post("/vehicle/update", verifyToken, updateVehicleDetails);

/* ============================================================
   DOCUMENTS
============================================================ */
router.get("/documents", verifyToken, getDriverDocuments);

/* ============================================================
   EARNINGS
============================================================ */
router.get("/earnings", verifyToken, getDriverEarnings);

export default router;
