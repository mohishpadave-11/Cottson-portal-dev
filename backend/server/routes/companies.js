/**
 * Companies Routes
 * All company-related endpoints
 */

import express from "express";
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/companyController.js";
import { protect as authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getCompanies);
router.get("/:id", getCompanyById);

// Protected routes (require authentication)
router.post("/", authenticate, authorize("admin", "superadmin"), createCompany);
router.put("/:id", authenticate, authorize("admin", "superadmin", "manager"), updateCompany);
router.delete("/:id", authenticate, authorize("admin", "superadmin"), deleteCompany);

export default router;
