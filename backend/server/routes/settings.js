import express from 'express';
import { getCustomCharges, updateCustomCharges } from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Publicly readable for now (or strictly protected if preferred), usually protected
/**
 * @swagger
 * /api/settings/charges:
 *   get:
 *     summary: Get custom charges
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Custom charges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 charges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       amount:
 *                         type: number
 */
router.get('/charges', protect, getCustomCharges);
/**
 * @swagger
 * /api/settings/charges:
 *   post:
 *     summary: Update custom charges
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - charges
 *             properties:
 *               charges:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     amount:
 *                       type: number
 *     responses:
 *       200:
 *         description: Custom charges updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 charges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       amount:
 *                         type: number
 */
router.post('/charges', protect, authorize('admin', 'superadmin'), updateCustomCharges);

export default router;
