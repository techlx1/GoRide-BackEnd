import {
  registerUser,
  loginUser,
  resetPassword,
  requestPasswordReset,
  verifyPasswordReset,
} from "../controllers/authController.js";

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/reset-password", resetPassword);
router.post("/request-reset", requestPasswordReset); // 👈 NEW
router.post("/verify-reset", verifyPasswordReset);   // 👈 NEW
