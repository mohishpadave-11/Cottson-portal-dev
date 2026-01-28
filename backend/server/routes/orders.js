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
/**
 * @swagger
 * /api/orders/next-number:
 *   get:
 *     summary: Get next available order number
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Next Order Number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nextOrderNumber:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/next-number", authenticate, authorize("superadmin", "admin", "manager"), getNextOrderNumber);
/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Server error
 */
router.get("/", authenticate, getOrders);
/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
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
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
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
/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       200:
 *         description: Order updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.put("/:id", authenticate, authorize("superadmin", "admin", "manager"), updateOrder);
router.patch("/:id", authenticate, authorize("superadmin", "admin", "manager"), updateOrder);
/**
 * @swagger
 * /api/orders/{id}/timeline:
 *   patch:
 *     summary: Update order timeline
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timeline:
 *                 type: string
 *     responses:
 *       200:
 *         description: Timeline updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.patch(
  "/:id/timeline",
  authenticate,
  authorize("superadmin", "admin", "manager"),
  updateOrderTimeline
);
/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted
 *       404:
 *         description: Order not found
 */
router.delete("/:id", authenticate, authorize("superadmin", "admin"), deleteOrder);

// Payment routes
// Payment routes
/**
 * @swagger
 * /api/orders/{id}/payments:
 *   post:
 *     summary: Add payment to order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - date
 *             properties:
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.post("/:id/payments", authenticate, authorize("superadmin", "admin", "manager"), addPayment);
router.put("/:id/payments/:paymentId", authenticate, authorize("superadmin", "admin", "manager"), updatePayment);
router.delete("/:id/payments/:paymentId", authenticate, authorize("superadmin", "admin", "manager"), deletePayment);

// File upload routes
// File upload routes
/**
 * @swagger
 * /api/orders/{id}/upload-url:
 *   post:
 *     summary: Get presigned URL for file upload
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
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
// Synch DB after direct upload
/**
 * @swagger
 * /api/orders/{id}/documents:
 *   put:
 *     summary: Update order documents (after upload)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documents
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     url:
 *                       type: string
 *                     fileType:
 *                       type: string
 *     responses:
 *       200:
 *         description: Documents updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.put(
  "/:id/documents",
  authenticate,
  authorize("superadmin", "admin", "manager"),
  updateOrderDocuments
);

// Notify Client
// Notify Client
/**
 * @swagger
 * /api/orders/{id}/documents/notify:
 *   post:
 *     summary: Notify client about new documents
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Client notified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post(
  "/:id/documents/notify",
  authenticate,
  authorize("superadmin", "admin"),
  notifyClient
);

// Document Management
// Document Management
/**
 * @swagger
 * /api/orders/{orderId}/documents/{docId}/rename:
 *   patch:
 *     summary: Rename document
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *       - in: path
 *         name: docId
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newName
 *             properties:
 *               newName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document renamed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.patch(
  "/:orderId/documents/:docId/rename",
  authenticate,
  authorize("superadmin", "admin", "manager"),
  renameDocument
);

/**
 * @swagger
 * /api/orders/{orderId}/documents/{docId}:
 *   delete:
 *     summary: Delete document
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *       - in: path
 *         name: docId
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.delete(
  "/:orderId/documents/:docId",
  authenticate,
  authorize("superadmin", "admin", "manager"),
  deleteDocument
);

export default router;
