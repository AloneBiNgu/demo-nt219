import { AuditLog, createAuditSignature, getPreviousLogHash, type IAuditLog } from '../models/auditLog.model';
import { env } from '../config/env';
import logger from '../utils/logger';
import { sendEmailAlert, sendFraudAlert, sendHighRiskOrderAlert, sendFailedLoginAlert } from './alert.service';

/**
 * Audit Log Service
 * Handles creation and querying of immutable audit logs
 */

export interface AuditLogEntry {
  eventType: string;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: {
    ip?: string;
    userAgent?: string;
    location?: string;
    [key: string]: any;
  };
  result: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  riskScore?: number;
}

/**
 * Create an audit log entry with cryptographic signature
 */
export const createAuditLog = async (entry: AuditLogEntry): Promise<void> => {
  try {
    const timestamp = new Date();
    
    // Get previous log hash for chain integrity
    const previousHash = await getPreviousLogHash();
    
    // Create signature
    const signature = createAuditSignature(
      { ...entry, timestamp },
      env.ENCRYPTION_KEY
    );
    
    const auditLog = new AuditLog({
      timestamp,
      ...entry,
      signature,
      previousHash
    });
    
    await auditLog.save();
    
    // Send alerts for high-risk events
    if (entry.riskScore && entry.riskScore >= 70) {
      logger.warn({
        eventType: entry.eventType,
        userId: entry.userId,
        riskScore: entry.riskScore,
        action: entry.action
      }, 'High-risk event logged');
      
      // Send email alert for critical/high-risk events
      if (entry.riskScore >= 80) {
        // Critical - send alert immediately
        await sendEmailAlert({
          type: entry.eventType.startsWith('payment') ? 'fraud' : 
                entry.eventType.startsWith('security') ? 'security' : 'high_risk',
          severity: 'critical',
          title: `Critical Event: ${entry.eventType}`,
          description: `High-risk event detected (score: ${entry.riskScore}/100). ${entry.action} on ${entry.resource}.`,
          userId: entry.userId,
          eventType: entry.eventType,
          riskScore: entry.riskScore,
          metadata: entry.metadata,
          timestamp,
          recommendations: [
            'Review event details immediately',
            'Verify user identity and activity',
            'Check for related suspicious events',
            'Consider account restrictions if needed'
          ]
        });
      }
    }
  } catch (error) {
    // Critical: Audit logging should never fail silently
    logger.error({ err: error, entry }, 'Failed to create audit log');
    // Don't throw - we don't want to break the main operation
  }
};

/**
 * Log authentication events
 */
export const logAuthEvent = async (
  eventType: 'auth.login' | 'auth.logout' | 'auth.register' | 'auth.password_reset' | 'auth.email_verify' | 'auth.2fa_enable' | 'auth.2fa_disable',
  userId: string | undefined,
  metadata: {
    ip?: string;
    userAgent?: string;
    email?: string;
    method?: string;
  },
  result: 'success' | 'failure',
  errorMessage?: string
): Promise<void> => {
  await createAuditLog({
    eventType,
    userId,
    action: eventType.split('.')[1],
    resource: 'authentication',
    metadata,
    result,
    errorMessage,
    riskScore: result === 'failure' ? 50 : undefined
  });
};

/**
 * Log payment events
 */
export const logPaymentEvent = async (
  eventType: 'payment.initiated' | 'payment.completed' | 'payment.failed' | 'payment.refunded',
  userId: string,
  orderId: string,
  metadata: {
    amount: number;
    currency: string;
    paymentMethod?: string;
    ip?: string;
    userAgent?: string;
  },
  result: 'success' | 'failure',
  errorMessage?: string
): Promise<void> => {
  // Calculate risk score based on amount and payment status
  let riskScore = 0;
  if (metadata.amount > 1000) riskScore += 30;
  if (metadata.amount > 5000) riskScore += 20;
  if (result === 'failure') riskScore += 25;
  
  await createAuditLog({
    eventType,
    userId,
    action: eventType.split('.')[1],
    resource: 'payment',
    resourceId: orderId,
    metadata,
    result,
    errorMessage,
    riskScore
  });
};

/**
 * Log order events
 */
export const logOrderEvent = async (
  eventType: 'order.created' | 'order.updated' | 'order.cancelled' | 'order.shipped',
  userId: string,
  orderId: string,
  changes?: {
    before?: any;
    after?: any;
  },
  metadata?: {
    ip?: string;
    userAgent?: string;
    totalAmount?: number;
    shippingAddress?: string;
  },
  result: 'success' | 'failure' = 'success'
): Promise<void> => {
  // Detect suspicious shipping address changes
  let riskScore = 0;
  if (changes?.before?.shippingAddress && changes?.after?.shippingAddress) {
    if (changes.before.shippingAddress !== changes.after.shippingAddress) {
      riskScore = 60; // High risk for address change
    }
  }
  
  // High-value orders
  if (metadata?.totalAmount && metadata.totalAmount > 10000) {
    riskScore += 30;
  }
  
  await createAuditLog({
    eventType,
    userId,
    action: eventType.split('.')[1],
    resource: 'order',
    resourceId: orderId,
    changes,
    metadata,
    result,
    riskScore
  });
};

/**
 * Log user profile changes
 */
export const logUserEvent = async (
  eventType: 'user.profile_update' | 'user.address_change' | 'user.role_change' | 'user.account_locked',
  userId: string,
  changes?: {
    before?: any;
    after?: any;
  },
  metadata?: {
    ip?: string;
    userAgent?: string;
    changedBy?: string;
  },
  result: 'success' | 'failure' = 'success'
): Promise<void> => {
  // Detect suspicious profile changes
  let riskScore = 0;
  if (eventType === 'user.address_change') {
    riskScore = 40; // Address changes are moderate risk
  }
  if (eventType === 'user.role_change') {
    riskScore = 80; // Role changes are high risk
  }
  
  await createAuditLog({
    eventType,
    userId,
    action: eventType.split('.')[1],
    resource: 'user',
    resourceId: userId,
    changes,
    metadata,
    result,
    riskScore
  });
};

/**
 * Log security events
 */
export const logSecurityEvent = async (
  eventType: 'security.failed_login' | 'security.rate_limit_exceeded' | 'security.suspicious_activity' | 'security.fraud_detected',
  userId: string | undefined,
  metadata: {
    ip?: string;
    userAgent?: string;
    reason?: string;
    attemptCount?: number;
  },
  riskScore: number = 70
): Promise<void> => {
  await createAuditLog({
    eventType,
    userId,
    action: eventType.split('.')[1],
    resource: 'security',
    metadata,
    result: 'failure',
    errorMessage: metadata.reason,
    riskScore
  });
};

/**
 * Query audit logs with filters
 */
export const queryAuditLogs = async (filters: {
  eventType?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  result?: 'success' | 'failure' | 'partial';
  minRiskScore?: number;
  limit?: number;
  skip?: number;
}) => {
  const query: any = {};
  
  if (filters.eventType) {
    query.eventType = filters.eventType;
  }
  
  if (filters.userId) {
    query.userId = filters.userId;
  }
  
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) {
      query.timestamp.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.timestamp.$lte = filters.endDate;
    }
  }
  
  if (filters.result) {
    query.result = filters.result;
  }
  
  if (filters.minRiskScore !== undefined) {
    query.riskScore = { $gte: filters.minRiskScore };
  }
  
  const logs = await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(filters.limit || 100)
    .skip(filters.skip || 0)
    .lean()
    .exec();
  
  const total = await AuditLog.countDocuments(query);
  
  return { logs, total };
};

/**
 * Get audit log statistics
 */
export const getAuditStats = async (filters: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const query: any = {};
  
  if (filters.userId) {
    query.userId = filters.userId;
  }
  
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) {
      query.timestamp.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.timestamp.$lte = filters.endDate;
    }
  }
  
  const [
    totalEvents,
    successCount,
    failureCount,
    highRiskCount,
    eventsByType
  ] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.countDocuments({ ...query, result: 'success' }),
    AuditLog.countDocuments({ ...query, result: 'failure' }),
    AuditLog.countDocuments({ ...query, riskScore: { $gte: 70 } }),
    AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);
  
  return {
    totalEvents,
    successCount,
    failureCount,
    highRiskCount,
    eventsByType: eventsByType.map((item: any) => ({
      eventType: item._id,
      count: item.count
    }))
  };
};

/**
 * Verify audit log chain integrity
 */
export const verifyAuditChain = async (limit: number = 1000): Promise<boolean> => {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: 1 })
      .limit(limit)
      .exec();
    
    for (let i = 1; i < logs.length; i++) {
      const currentLog = logs[i];
      const previousLog = logs[i - 1];
      
      // Verify that current log's previousHash matches previous log
      const expectedHash = require('crypto')
        .createHash('sha256')
        .update(previousLog.signature + previousLog.timestamp.toISOString())
        .digest('hex');
      
      if (currentLog.previousHash !== expectedHash) {
        logger.error({
          currentLogId: currentLog._id,
          previousLogId: previousLog._id
        }, 'Audit chain integrity violation detected');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Failed to verify audit chain');
    return false;
  }
};
