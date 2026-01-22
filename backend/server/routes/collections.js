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
router.get('/', getCollections);
router.get('/:id', getCollectionById);

// Protected routes
router.post('/', authenticate, authorize('superadmin', 'admin', 'manager'), createCollection);
router.put('/:id', authenticate, authorize('superadmin', 'admin', 'manager'), updateCollection);
router.delete('/:id', authenticate, authorize('superadmin', 'admin'), deleteCollection);

export default router;
