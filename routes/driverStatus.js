import express from "express";
import { updateDriverLocation, setOnlineStatus, getOnlineDrivers } from "../controllers/driverStatusController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/location", verifyToken, updateDriverLocation);
router.put("/status", verifyToken, setOnlineStatus);
router.get("/online", getOnlineDrivers);

export default router;
