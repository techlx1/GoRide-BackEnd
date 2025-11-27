import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  updateDriverStatus,
  updateDriverLocation,
  setOnlineStatus,
  getOnlineDrivers
} from "../controllers/driverStatusController.js";

const router = express.Router();

router.post("/update", verifyToken, updateDriverStatus);
router.post("/location", verifyToken, updateDriverLocation);
router.post("/online", verifyToken, setOnlineStatus);

// This route calls the function and returns JSON
router.get("/online", async (req, res) => {
  const result = await getOnlineDrivers();
  res.json(result);
});

export default router;
