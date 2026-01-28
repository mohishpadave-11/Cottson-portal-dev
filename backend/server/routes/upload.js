import express from "express";
import { getPresignedUrl } from "../controllers/uploadController.js";
import { protect, isAdminOrSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get presigned URL for direct upload
// Protected: Only Admin/SuperAdmin can upload (as per user request)
/**
 * @swagger
 * /api/upload/sign-url:
 *   post:
 *     summary: Get presigned URL for file upload
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *             properties:
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presigned URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 key:
 *                   type: string
 */
router.post("/sign-url", protect, isAdminOrSuperAdmin, getPresignedUrl);

export default router;
