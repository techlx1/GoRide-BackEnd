import express from "express";
import { getProfile, updateProfile, deleteProfile } from "../controllers/profileController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", verifyToken, getProfile);
router.put("/:id", verifyToken, updateProfile);
router.delete("/:id", verifyToken, deleteProfile);

export default router;
