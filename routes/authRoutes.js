import express from "express";
import {
  registerUser,
  loginWithOtp,
  verifyOtp,
  requestPasswordReset,
  verifyPasswordReset,
} from "../controllers/authController.js";

const router = express.Router();

/**
 * 📝 REGISTER (optional – admin / future use)
 * POST /api/auth/register
 */
router.post("/register", registerUser);

/**
 * 🔐 DRIVER LOGIN (OTP)
 * POST /api/auth/login-with-otp
 */
router.post("/login-with-otp", loginWithOtp);
router.post("/verify-otp", verifyOtp);

/**
 * 🔑 REQUEST PASSWORD RESET (mock)
 * POST /api/auth/request-reset
 */
router.post("/request-reset", requestPasswordReset);

/**
 * 🔄 VERIFY PASSWORD RESET (mock)
 * POST /api/auth/verify-reset
 */
router.post("/verify-reset", verifyPasswordReset);

export default router;
