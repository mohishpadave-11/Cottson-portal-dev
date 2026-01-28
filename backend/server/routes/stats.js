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
/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get overall statistics
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Statistics data
 */
router.get("/", getStats);
/**
 * @swagger
 * /api/stats/revenue/monthly:
 *   get:
 *     summary: Get monthly revenue
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly revenue data
 */
router.get("/revenue/monthly", authenticate, getRevenueByMonth);
/**
 * @swagger
 * /api/stats/orders/status:
 *   get:
 *     summary: Get orders by status
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order status breakdown
 */
router.get("/orders/status", authenticate, getOrdersByStatus);
/**
 * @swagger
 * /api/stats/companies/top:
 *   get:
 *     summary: Get top performing companies
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top companies list
 */
router.get("/companies/top", authenticate, getTopCompanies);
/**
 * @swagger
 * /api/stats/companies/active-stats:
 *   get:
 *     summary: Get active company statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active company stats
 */
router.get("/companies/active-stats", authenticate, getActiveCompanyStats);
/**
 * @swagger
 * /api/stats/companies/new-stats:
 *   get:
 *     summary: Get new company statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New company stats
 */
router.get("/companies/new-stats", authenticate, getNewCompanyStats);
/**
 * @swagger
 * /api/stats/companies/total-stats:
 *   get:
 *     summary: Get total company statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total company stats
 */
router.get("/companies/total-stats", authenticate, getTotalCompanyStats);

export default router;
