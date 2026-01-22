/**
 * Products Routes
 * All product-related endpoints
 */

import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect as authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected routes (require authentication)
router.post("/", authenticate, authorize("superadmin", "admin", "manager"), createProduct);
router.put("/:id", authenticate, authorize("superadmin", "admin", "manager"), updateProduct);
router.delete("/:id", authenticate, authorize("superadmin", "admin"), deleteProduct);

export default router;
