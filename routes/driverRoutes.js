// routes/driverRoutes.js
import express from "express";
import { getDriverProfile, getDriverVehicle } from "../controllers/driverController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🧾 Fetch full driver profile
router.get("/profile", verifyToken, getDriverProfile);

// 🚗 Fetch only vehicle info
router.get("/vehicle", verifyToken, getDriverVehicle);

export default router;
