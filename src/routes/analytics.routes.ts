import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
  getDashboardStatsHandler,
  getSalesAnalyticsHandler,
  getRevenueAnalyticsHandler,
  getTopProductsHandler,
  getRecentActivityHandler
} from '../controllers/analytics.controller';

const router = Router();

// All analytics routes require admin access
router.get('/dashboard-stats', authenticate, authorize('admin'), getDashboardStatsHandler);
router.get('/sales', authenticate, authorize('admin'), getSalesAnalyticsHandler);
router.get('/revenue', authenticate, authorize('admin'), getRevenueAnalyticsHandler);
router.get('/top-products', authenticate, authorize('admin'), getTopProductsHandler);
router.get('/recent-activity', authenticate, authorize('admin'), getRecentActivityHandler);

export default router;
