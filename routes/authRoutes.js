import express from "express";
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  verifyPasswordReset,
} from "../controllers/authController.js";

const router = express.Router();

/**
 * 📝 REGISTER
 * Endpoint: POST /api/auth/register
 * Body: { full_name, email, phone, password, user_type }
 */
router.post("/register", registerUser);

/**
 * 🔐 LOGIN
 * Endpoint: POST /api/auth/login
 * Body: { email or phone, password }
 */
router.post("/login", loginUser);

/**
 * 🔑 REQUEST PASSWORD RESET (OTP)
 * Endpoint: POST /api/auth/request-reset
 * Body: { email or phone }
 */
router.post("/request-reset", requestPasswordReset);

/**
 * ✅ VERIFY OTP + RESET PASSWORD
 * Endpoint: POST /api/auth/verify-reset
 * Body: { email or phone, otp, newPassword }
 */
router.post("/verify-reset", verifyPasswordReset);

export default router;
