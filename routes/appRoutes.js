import { getAppVersion } from "../controllers/appVersionController.js";
import express from "express";
import { verifyToken } from '../middleware/authMiddleware.js';
import { submitSuggestion } from '../controllers/settingsController.js';



const router = express.Router();

router.get("/version", getAppVersion);
router.post('/suggestions', verifyToken, submitSuggestion);

export default router;
