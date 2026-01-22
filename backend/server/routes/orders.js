/**
 * Orders Routes
 * All order-related endpoints
 */

import express from "express";
import multer from "multer";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderTimeline,
  deleteOrder,
  uploadFileToOrder,
  addPayment,
  updatePayment,
  deletePayment,
  updateOrderDocuments,
  notifyClient,
  getNextOrderNumber
} from "../controllers/orderController.js";
import { renameDocument, deleteDocument } from "../controllers/documentController.js";
import { getOrderPresignedUrl } from "../controllers/uploadController.js";
import { protect as authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Multer configuration for file uploads (memory storage for R2)
const storage = multer.memoryStorage();

const upload = multer({ storage });

// Public routes
router.get("/next-number", authenticate, authorize("superadmin", "admin", "manager"), getNextOrderNumber);
router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrderById);

// Protected routes (require authentication)
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order with client, company, and product details. Only accessible by admins/managers.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client
 *               - company
 *               - products
 *             properties:
 *               client:
 *                 type: string
 *                 description: Client ID
 *               company:
 *                 type: string
 *                 description: Company ID
 *               date:
 *                 type: string
 *                 format: date
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", authenticate, authorize("superadmin", "admin", "manager"), createOrder);
router.put("/:id", authenticate, authorize("superadmin", "admin", "manager"), updateOrder);
router.patch("/:id", authenticate, authorize("superadmin", "admin", "manager"), updateOrder);
router.patch(
  "/:id/timeline",
  authenticate,
  authorize("superadmin", "admin", "manager"),
  updateOrderTimeline
);
router.delete("/:id", authenticate, authorize("superadmin", "admin"), deleteOrder);

// Payment routes
router.post("/:id/payments", authenticate, authorize("superadmin", "admin", "manager"), addPayment);
router.put("/:id/payments/:paymentId", authenticate, authorize("superadmin", "admin", "manager"), updatePayment);
router.delete("/:id/payments/:paymentId", authenticate, authorize("superadmin", "admin", "manager"), deletePayment);

// File upload routes
router.post(
  "/:id/upload-url",
  authenticate,
  authorize("superadmin", "admin", "manager"),
  getOrderPresignedUrl
);

router.post(
  "/:id/upload",
  authenticate,
  upload.single("file"),
  uploadFileToOrder
);

// Synch DB after direct upload
router.put(
  "/:id/documents",
  authenticate,
  authorize("superadmin", "admin", "manager"),
  updateOrderDocuments
);

// Notify Client
router.post(
  "/:id/documents/notify",
  authenticate,
  authorize("superadmin", "admin"),
  notifyClient
);

// Document Management
router.patch(
  "/:orderId/documents/:docId/rename",
  authenticate,
  authorize("superadmin", "admin", "manager"),
  renameDocument
);

router.delete(
  "/:orderId/documents/:docId",
  authenticate,
  authorize("superadmin", "admin", "manager"),
  deleteDocument
);

export default router;
