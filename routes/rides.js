import express from "express";
import { createRide, getAllRides, updateRideStatus } from "../controllers/ridesController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new ride request
router.post("/", verifyToken, createRide);

// Get all rides for a specific user
router.get("/", verifyToken, getAllRides);

// Update ride status (accepted, in_progress, completed)
router.put("/:id/status", verifyToken, updateRideStatus);

export default router;
