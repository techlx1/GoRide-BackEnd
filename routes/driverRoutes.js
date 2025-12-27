import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

/* ============================================================
   CONTROLLERS
============================================================ */

// Driver (PROFILE / CORE ONLY)
import {
  getDriverProfile,
  getDriverOverview,
  getDriverVehicle,
  getDriverDocuments,
  updateDriverProfile,
} from "../controllers/driverController.js";

// Rides (RECENT ORDERS)
import { getRecentOrders } from "../controllers/ridesController.js";

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

// Earnings
import { getEarningsSummary } from "../controllers/earningsController.js";

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

// Driver status
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
  try {
    const result = await getOnlineDrivers();
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
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
   RIDES (RECENT ORDERS)
============================================================ */
router.get("/rides/recent", verifyToken, getRecentOrders);

/* ============================================================
   EARNINGS
============================================================ */
router.get("/earnings", verifyToken, getEarningsSummary);

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
router.get("/referral", verifyToken, getReferralInfo);

export default router;
