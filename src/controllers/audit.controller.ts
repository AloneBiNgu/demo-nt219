import { Request, Response } from 'express';
import {
  queryAuditLogs,
  getAuditStats,
  verifyAuditChain
} from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

/**
 * Admin Audit Log Controller
 * Provides endpoints for viewing and analyzing audit logs
 */

/**
 * Get audit logs with filters
 * GET /api/admin/audit-logs
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      eventType,
      userId,
      startDate,
      endDate,
      result,
      minRiskScore,
      limit,
      skip
    } = req.query;

    const filters = {
      eventType: eventType as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      result: result as 'success' | 'failure' | 'partial' | undefined,
      minRiskScore: minRiskScore ? Number(minRiskScore) : undefined,
      limit: limit ? Number(limit) : 100,
      skip: skip ? Number(skip) : 0
    };

    const data = await queryAuditLogs(filters);

    logger.info({
      adminId: (req.user as any)?._id?.toString(),
      filters,
      resultCount: data.logs.length
    }, 'Admin queried audit logs');

    return sendSuccess(res, 200, {
      logs: data.logs,
      total: data.total,
      limit: filters.limit,
      skip: filters.skip
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get audit logs');
    return sendError(res, 500, 'Failed to retrieve audit logs');
  }
};

/**
 * Get audit log statistics
 * GET /api/admin/audit-stats
 */
export const getAuditStatistics = async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const filters = {
      userId: userId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const stats = await getAuditStats(filters);

    logger.info({
      adminId: (req.user as any)?._id?.toString(),
      filters
    }, 'Admin requested audit statistics');

    return sendSuccess(res, 200, stats);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get audit statistics');
    return sendError(res, 500, 'Failed to retrieve audit statistics');
  }
};

/**
 * Verify audit log chain integrity
 * POST /api/admin/verify-audit-chain
 */
export const verifyIntegrity = async (req: Request, res: Response) => {
  try {
    const { limit } = req.body;

    const isValid = await verifyAuditChain(limit || 1000);

    logger.info({
      adminId: (req.user as any)?._id?.toString(),
      limit: limit || 1000,
      isValid
    }, 'Admin verified audit chain integrity');

    return sendSuccess(res, 200, {
      isValid,
      message: isValid
        ? 'Audit chain integrity verified successfully'
        : 'Audit chain integrity violation detected!',
      checkedLogs: limit || 1000
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to verify audit chain');
    return sendError(res, 500, 'Failed to verify audit chain integrity');
  }
};

/**
 * Get security metrics for monitoring dashboard
 * GET /api/admin/security-metrics
 */
export const getSecurityMetrics = async (req: Request, res: Response) => {
  try {
    const { timeRange } = req.query;
    
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const stats = await getAuditStats({ startDate, endDate: now });

    // Get specific security metrics
    const { logs: failedLogins } = await queryAuditLogs({
      eventType: 'security.failed_login',
      startDate,
      endDate: now,
      limit: 1000
    });

    const { logs: fraudDetections } = await queryAuditLogs({
      eventType: 'security.fraud_detected',
      startDate,
      endDate: now,
      limit: 1000
    });

    const { logs: highRiskOrders } = await queryAuditLogs({
      eventType: 'order.created',
      minRiskScore: 70,
      startDate,
      endDate: now,
      limit: 1000
    });

    const { logs: blockedPayments } = await queryAuditLogs({
      eventType: 'payment.failed',
      minRiskScore: 60,
      startDate,
      endDate: now,
      limit: 1000
    });

    const metrics = {
      timeRange: timeRange || '24h',
      period: {
        start: startDate,
        end: now
      },
      overview: {
        totalEvents: stats.totalEvents,
        successRate: stats.totalEvents > 0
          ? ((stats.successCount / stats.totalEvents) * 100).toFixed(2) + '%'
          : '0%',
        failureRate: stats.totalEvents > 0
          ? ((stats.failureCount / stats.totalEvents) * 100).toFixed(2) + '%'
          : '0%'
      },
      security: {
        failedLogins: failedLogins.length,
        fraudDetections: fraudDetections.length,
        highRiskOrders: highRiskOrders.length,
        blockedPayments: blockedPayments.length,
        highRiskEvents: stats.highRiskCount
      },
      topEvents: stats.eventsByType.slice(0, 10)
    };

    logger.info({
      adminId: (req.user as any)?._id?.toString(),
      timeRange: timeRange || '24h'
    }, 'Admin requested security metrics');

    return sendSuccess(res, 200, metrics);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get security metrics');
    return sendError(res, 500, 'Failed to retrieve security metrics');
  }
};

/**
 * Get user activity timeline
 * GET /api/admin/user-activity/:userId
 */
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit, skip } = req.query;

    const data = await queryAuditLogs({
      userId,
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0
    });

    logger.info({
      adminId: (req.user as any)?._id?.toString(),
      targetUserId: userId,
      resultCount: data.logs.length
    }, 'Admin requested user activity timeline');

    return sendSuccess(res, 200, {
      userId,
      logs: data.logs,
      total: data.total
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user activity');
    return sendError(res, 500, 'Failed to retrieve user activity');
  }
};

/**
 * Get high-risk events
 * GET /api/admin/high-risk-events
 */
export const getHighRiskEvents = async (req: Request, res: Response) => {
  try {
    const { minRiskScore, limit, skip } = req.query;

    const data = await queryAuditLogs({
      minRiskScore: minRiskScore ? Number(minRiskScore) : 70,
      limit: limit ? Number(limit) : 100,
      skip: skip ? Number(skip) : 0
    });

    logger.info({
      adminId: (req.user as any)?._id?.toString(),
      minRiskScore: minRiskScore || 70,
      resultCount: data.logs.length
    }, 'Admin requested high-risk events');

    return sendSuccess(res, 200, {
      logs: data.logs,
      total: data.total,
      minRiskScore: minRiskScore || 70
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get high-risk events');
    return sendError(res, 500, 'Failed to retrieve high-risk events');
  }
};
