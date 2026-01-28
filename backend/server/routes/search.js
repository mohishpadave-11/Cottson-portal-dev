import express from "express";
import { protect } from "../middleware/auth.js";
import { globalSearch } from "../controllers/searchController.js";

const router = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global search (orders, clients, companies, products)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *                 companies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get("/", protect, globalSearch);

export default router;
