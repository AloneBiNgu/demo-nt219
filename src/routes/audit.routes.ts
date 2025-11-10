import { Router } from 'express';
import {
  getAuditLogs,
  getAuditStatistics,
  verifyIntegrity,
  getSecurityMetrics,
  getUserActivity,
  getHighRiskEvents
} from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

/**
 * Admin Audit Log Routes
 * All routes require authentication and admin role
 */

// Apply authentication and admin check to all routes
router.use(authenticate, authorize('admin'));

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs with filters
 * @access  Admin only
 * @query   eventType, userId, startDate, endDate, result, minRiskScore, limit, skip
 */
router.get('/audit-logs', getAuditLogs);

/**
 * @route   GET /api/admin/audit-stats
 * @desc    Get audit log statistics
 * @access  Admin only
 * @query   userId, startDate, endDate
 */
router.get('/audit-stats', getAuditStatistics);

/**
 * @route   POST /api/admin/verify-audit-chain
 * @desc    Verify audit log chain integrity
 * @access  Admin only
 * @body    { limit?: number }
 */
router.post('/verify-audit-chain', verifyIntegrity);

/**
 * @route   GET /api/admin/security-metrics
 * @desc    Get security metrics for monitoring dashboard
 * @access  Admin only
 * @query   timeRange (1h|24h|7d|30d)
 */
router.get('/security-metrics', getSecurityMetrics);

/**
 * @route   GET /api/admin/user-activity/:userId
 * @desc    Get user activity timeline
 * @access  Admin only
 * @param   userId - User ID
 * @query   limit, skip
 */
router.get('/user-activity/:userId', getUserActivity);

/**
 * @route   GET /api/admin/high-risk-events
 * @desc    Get high-risk events
 * @access  Admin only
 * @query   minRiskScore, limit, skip
 */
router.get('/high-risk-events', getHighRiskEvents);

export default router;
