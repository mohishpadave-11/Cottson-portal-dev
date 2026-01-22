/**
 * Stats Routes
 * Dashboard statistics endpoints
 */

import express from "express";
import {
  getStats,
  getRevenueByMonth,
  getOrdersByStatus,
  getTopCompanies,
  getActiveCompanyStats,
  getNewCompanyStats,
  getTotalCompanyStats,
} from "../controllers/statsController.js";
import { protect as authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes (optionally add authentication if needed)
router.get("/", getStats);
router.get("/revenue/monthly", authenticate, getRevenueByMonth);
router.get("/orders/status", authenticate, getOrdersByStatus);
router.get("/companies/top", authenticate, getTopCompanies);
router.get("/companies/active-stats", authenticate, getActiveCompanyStats);
router.get("/companies/new-stats", authenticate, getNewCompanyStats);
router.get("/companies/total-stats", authenticate, getTotalCompanyStats);

export default router;
