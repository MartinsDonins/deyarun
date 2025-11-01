// TEMPORARILY DISABLED: Payments route migrating to MongoDB
// This route has been temporarily disabled to allow backend startup while migrating to MongoDB-only architecture
// Payment features are related to subscriptions and will be re-enabled after MongoDB migration is complete

import express from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

console.warn('⚠️ Payments route temporarily disabled - features migrating to MongoDB');

// Temporary message for all payment endpoints
const temporaryDisabledResponse = (req, res) => {
  res.status(503).json({
    success: false,
    error: 'Feature temporarily unavailable',
    message: 'Payment features are currently being migrated to MongoDB and will be available soon.',
    feature: 'payments',
    status: 'migration_in_progress'
  });
};

// All payment endpoints temporarily disabled
router.all('*', temporaryDisabledResponse);

export default router;