import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from "../controllers/notificationsController.js";

const router = express.Router();

// Get all notifications
router.get("/", verifyToken, getNotifications);

// Get unread count
router.get("/unread-count", verifyToken, getUnreadCount);

// Mark one as read
router.patch("/:id/read", verifyToken, markAsRead);

// Mark all as read
router.patch("/read-all", verifyToken, markAllAsRead);

export default router;
