import express from "express";
const router = express.Router();

/**
 * 🧠 Environment & Config Checker
 * GET /api/debug/env-check
 */
router.get("/env-check", (req, res) => {
  res.json({
    success: true,
    jwt_defined: !!process.env.JWT_SECRET,
    db_url_exists: !!process.env.DATABASE_URL,
    node_env: process.env.NODE_ENV,
  });
});

export default router;
