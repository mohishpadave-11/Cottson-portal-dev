import express from 'express';
import {
    getCollections,
    getCollectionById,
    createCollection,
    updateCollection,
    deleteCollection
} from '../controllers/collectionController.js';
import { protect as authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes (or protected depending on requirements, usually creating/updating is protected)
/**
 * @swagger
 * /api/collections:
 *   get:
 *     summary: Get all collections
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: List of collections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Collection'
 *       500:
 *         description: Server error
 */
router.get('/', getCollections);
/**
 * @swagger
 * /api/collections/{id}:
 *   get:
 *     summary: Get collection by ID
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Collection ID
 *     responses:
 *       200:
 *         description: Collection details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       404:
 *         description: Collection not found
 */
router.get('/:id', getCollectionById);

// Protected routes
/**
 * @swagger
 * /api/collections:
 *   post:
 *     summary: Create new collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Collection'
 *     responses:
 *       201:
 *         description: Collection created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, authorize('superadmin', 'admin', 'manager'), createCollection);
/**
 * @swagger
 * /api/collections/{id}:
 *   put:
 *     summary: Update collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Collection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Collection'
 *     responses:
 *       200:
 *         description: Collection updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       404:
 *         description: Collection not found
 */
router.put('/:id', authenticate, authorize('superadmin', 'admin', 'manager'), updateCollection);
/**
 * @swagger
 * /api/collections/{id}:
 *   delete:
 *     summary: Delete collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Collection ID
 *     responses:
 *       200:
 *         description: Collection deleted
 *       404:
 *         description: Collection not found
 */
router.delete('/:id', authenticate, authorize('superadmin', 'admin'), deleteCollection);

export default router;
