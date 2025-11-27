import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { updateVehicleDetails, uploadVehiclePhoto } from "../controllers/vehicleController.js";

const router = express.Router();

// Upload image
router.post("/upload-photo", verifyToken, uploadVehiclePhoto);

// Create/update vehicle
router.post("/upsert", verifyToken, updateVehicleDetails);

// Get vehicle
router.get("/me", verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("profile_id", req.user.id)
    .maybeSingle();

  return res.json({
    success: true,
    vehicle: data,
  });
});

export default router;
