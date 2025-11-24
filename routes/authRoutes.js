import express from "express";
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  verifyPasswordReset,
} from "GoRide-BackEnd/controllers/authController.js";

const router = express.Router();

/**
 * 📝 REGISTER
 * POST /api/auth/register
 */
router.post("/register", registerUser);

/**
 * 🔐 LOGIN
 * POST /api/auth/login
 */
router.post("/login", loginUser);

/**
 * 🔑 REQUEST RESET
 * POST /api/auth/request-reset
 */
router.post("/request-reset", requestPasswordReset);

/**
 * 🔄 VERIFY RESET
 * POST /api/auth/verify-reset
 */
router.post("/verify-reset", verifyPasswordReset);

export default router;
