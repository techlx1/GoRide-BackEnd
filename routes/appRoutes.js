import { getAppVersion } from "../controllers/appVersionController.js";
import express from "express";
import { verifyToken } from '../middleware/authMiddleware.js';
import { submitSuggestion } from '../controllers/settingsController.js';

import { updateLanguage } from '../controllers/appController.js';




const router = express.Router();

router.get("/version", getAppVersion);
router.post('/suggestions', verifyToken, submitSuggestion);
router.post('/language', verifyToken, updateLanguage);
export default router;
