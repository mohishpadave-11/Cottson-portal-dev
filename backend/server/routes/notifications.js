import express from "express";
import { getUserNotifications, markRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get all notifications for the user
router.get("/", protect, getUserNotifications);

// Mark as read
router.put("/:id/read", protect, markRead);

export default router;
