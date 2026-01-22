import express from "express";
import { getPresignedUrl } from "../controllers/uploadController.js";
import { protect, isAdminOrSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get presigned URL for direct upload
// Protected: Only Admin/SuperAdmin can upload (as per user request)
router.post("/sign-url", protect, isAdminOrSuperAdmin, getPresignedUrl);

export default router;
