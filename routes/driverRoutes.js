import express from "express";

import {
  getDriverProfile,
  getDriverOverview,
  getDriverVehicle,
  getDriverDocuments,
  getDriverEarnings,
} from "../controllers/driverController.js";

import { updateVehicleDetails } from "../controllers/vehicleController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

// WALLET MODULE (clean + unified)
import {
  getWalletOverview,
  getWalletTransactions,
  requestPayout,
  sendMoney,
  getReceiveInfo,
} from "../controllers/walletController.js";

const router = express.Router();

/* ============================================================
   DRIVER PROFILE / OVERVIEW
============================================================ */
router.get("/profile", verifyToken, getDriverProfile);
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
   EARNINGS
============================================================ */
router.get("/earnings", verifyToken, getDriverEarnings);

/* ============================================================
   WALLET (FULL MODULE)
============================================================ */

// Wallet Summary (balance + last 10 transactions)
router.get("/wallet", verifyToken, getWalletOverview);

// Paginated transaction list
router.get("/wallet/transactions", verifyToken, getWalletTransactions);

// Request Payout
router.post("/wallet/payout", verifyToken, requestPayout);

// Send Money (Wallet → Wallet)
router.post("/wallet/send", verifyToken, sendMoney);

// Receive Info (Wallet Address + QR payload)
router.get("/wallet/receive", verifyToken, getReceiveInfo);

export default router;
