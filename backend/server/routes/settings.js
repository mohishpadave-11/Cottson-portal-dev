import express from 'express';
import { getCustomCharges, updateCustomCharges } from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Publicly readable for now (or strictly protected if preferred), usually protected
router.get('/charges', protect, getCustomCharges);
router.post('/charges', protect, authorize('admin', 'superadmin'), updateCustomCharges);

export default router;
