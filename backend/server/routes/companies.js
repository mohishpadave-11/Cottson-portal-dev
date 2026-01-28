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
  getNextCompanyId,
} from "../controllers/companyController.js";
import { protect as authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public routes
/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Get all companies
 *     tags: [Companies]
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 *       500:
 *         description: Server error
 */
router.get("/", getCompanies);
/**
 * @swagger
 * /api/companies/next-id:
 *   get:
 *     summary: Get next available company ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Next Company ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nextId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/next-id", authenticate, getNextCompanyId);
/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Company not found
 */
router.get("/:id", getCompanyById);

// Protected routes (require authentication)
/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create new company (Admin/SuperAdmin)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: Company created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", authenticate, authorize("admin", "superadmin"), createCompany);
/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: Update company (Admin/SuperAdmin/Manager)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: Company updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Company not found
 */
router.put("/:id", authenticate, authorize("admin", "superadmin", "manager"), updateCompany);
/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Delete company (Admin/SuperAdmin)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Company not found
 */
router.delete("/:id", authenticate, authorize("admin", "superadmin"), deleteCompany);

export default router;
