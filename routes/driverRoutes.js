import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

/* ============================================================
   CONTROLLERS
============================================================ */

// Driver
import {
  getDriverProfile,
  getDriverOverview,
  getDriverVehicle,
  getDriverDocuments,
  updateDriverProfile,
} from "../controllers/driverController.js";

// Vehicle
import { updateVehicleDetails } from "../controllers/vehicleController.js";

// Wallet
import {
  getWalletOverview,
  getWalletTransactions,
  requestPayout,
  sendMoney,
  getReceiveInfo,
} from "../controllers/walletController.js";

// Account
import { deleteDriverAccount } from "../controllers/accountController.js";

// App / Settings
import {
  submitSuggestion,
  updateSettings,
  updateNotificationSettings,
} from "../controllers/settingsController.js";

// Referral
import { getReferralInfo } from "../controllers/referralController.js";

// Driver status (MAKE SURE THESE EXIST)
import {
  setOnlineStatus,
  updateDriverLocation,
  getOnlineDrivers,
} from "../controllers/driverStatusController.js";

/* ============================================================
   ROUTER
============================================================ */
const router = express.Router();

/* ============================================================
   DRIVER STATUS
============================================================ */

// Online / Offline
router.post("/status", verifyToken, setOnlineStatus);

// Live GPS (REST fallback)
router.post("/location", verifyToken, updateDriverLocation);

// Online drivers (admin)
router.get("/status/online", verifyToken, async (req, res) => {
  const result = await getOnlineDrivers();
  res.json(result);
});

/* ============================================================
   DRIVER PROFILE / OVERVIEW
============================================================ */
router.get("/profile", verifyToken, getDriverProfile);
router.put("/profile", verifyToken, updateDriverProfile);
router.get("/overview", verifyToken, getDriverOverview);

/* ============================================================
   VEHICLE
============================================================ */
router.get("/vehicle", verifyToken, getDriverVehicle);
router.post("/vehicle/update", verifyToken, updateVehicleDetails);

/* ============================================================
   DOCUMENTS
============================================================ */
router.get("/documents", verifyToken, getDriverDocuments);

/* ============================================================
   WALLET
============================================================ */
router.get("/wallet", verifyToken, getWalletOverview);
router.get("/wallet/transactions", verifyToken, getWalletTransactions);
router.post("/wallet/payout", verifyToken, requestPayout);
router.post("/wallet/send", verifyToken, sendMoney);
router.get("/wallet/receive", verifyToken, getReceiveInfo);

/* ============================================================
   ACCOUNT
============================================================ */
router.post("/account/delete", verifyToken, deleteDriverAccount);

/* ============================================================
   APP FEEDBACK & SETTINGS
============================================================ */
router.post("/suggestions", verifyToken, submitSuggestion);
router.put("/settings", verifyToken, updateSettings);
router.put("/settings/notifications", verifyToken, updateNotificationSettings);

/* ============================================================
   REFERRALS
============================================================ */
router.get("/invite", verifyToken, getReferralInfo);

export default router;
