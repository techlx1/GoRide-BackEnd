import { getAppVersion } from "../controllers/appVersionController.js";
import express from "express";

const router = express.Router();

router.get("/version", getAppVersion);

export default router;
