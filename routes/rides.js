import express from "express";
import { createRide, getRides, updateRideStatus } from "../controllers/ridesController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createRide);
router.get("/", verifyToken, getRides);
router.put("/:id/status", verifyToken, updateRideStatus);

export default router;
