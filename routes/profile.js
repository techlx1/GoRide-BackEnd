import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getUserProfile } from "../controllers/profileController.js";

const router = express.Router();

router.get("/me", verifyToken, getUserProfile);

export default router;
