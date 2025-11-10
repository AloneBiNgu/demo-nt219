import { RefreshTokenModel, RefreshTokenDocument } from '../models/refreshToken.model';
import { hashToken } from '../utils/jwt';
import { DeviceInfo } from '../types';
import logger from '../utils/logger';

/**
 * Create and store a new refresh token
 */
export const createRefreshToken = async (
  token: string,
  userId: string,
  deviceInfo: DeviceInfo,
  family: string,
  expiresAt: Date
): Promise<RefreshTokenDocument> => {
  const tokenHash = hashToken(token);

  const refreshToken = new RefreshTokenModel({
    tokenHash,
    userId,
    deviceId: deviceInfo.deviceId,
    deviceName: deviceInfo.deviceName,
    userAgent: deviceInfo.userAgent,
    ipAddress: deviceInfo.ipAddress,
    location: deviceInfo.location,
    family,
    expiresAt,
    isRevoked: false,
    lastUsedAt: new Date()
  });

  await refreshToken.save();
  logger.debug({ userId, family }, 'Refresh token created');

  return refreshToken;
};

/**
 * Validate refresh token
 * Returns token document if valid, throws error otherwise
 */
export const validateRefreshToken = async (token: string): Promise<RefreshTokenDocument> => {
  const tokenHash = hashToken(token);

  const refreshToken = await RefreshTokenModel.findOne({ tokenHash });

  if (!refreshToken) {
    logger.warn({ tokenHash: tokenHash.substring(0, 8) }, 'Refresh token not found');
    throw new Error('Invalid refresh token');
  }

  // Check if token is revoked
  if (refreshToken.isRevoked) {
    logger.warn(
      {
        userId: refreshToken.userId,
        family: refreshToken.family,
        revokedReason: refreshToken.revokedReason
      },
      '⚠️ SECURITY ALERT: Revoked refresh token was reused - possible token theft!'
    );

    // Token reuse detected! Revoke entire token family
    await revokeTokenFamily(refreshToken.family, 'Token reuse detected - security breach');

    throw new Error('Token reuse detected');
  }

  // Check if token is expired
  if (refreshToken.expiresAt < new Date()) {
    logger.debug({ userId: refreshToken.userId }, 'Refresh token expired');
    throw new Error('Refresh token expired');
  }

  // Update last used timestamp
  refreshToken.lastUsedAt = new Date();
  await refreshToken.save();

  return refreshToken;
};

/**
 * Revoke a specific refresh token
 */
export const revokeRefreshToken = async (
  token: string,
  reason: string = 'User logged out'
): Promise<void> => {
  const tokenHash = hashToken(token);

  const result = await RefreshTokenModel.updateOne(
    { tokenHash },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason
      }
    }
  );

  if (result.modifiedCount > 0) {
    logger.debug({ reason }, 'Refresh token revoked');
  }
};

/**
 * Revoke all tokens in a token family
 * Used when token reuse is detected
 */
export const revokeTokenFamily = async (family: string, reason: string): Promise<void> => {
  const result = await RefreshTokenModel.updateMany(
    { family, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason
      }
    }
  );

  logger.warn(
    { family, revokedCount: result.modifiedCount, reason },
    '🔒 Entire token family revoked due to security breach'
  );
};

/**
 * Revoke all refresh tokens for a user
 * Used when: password changed, account compromised, user requests logout from all devices
 */
export const revokeAllUserTokens = async (
  userId: string,
  reason: string = 'User logged out from all devices'
): Promise<void> => {
  const result = await RefreshTokenModel.updateMany(
    { userId, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason
      }
    }
  );

  logger.info({ userId, revokedCount: result.modifiedCount, reason }, 'All user tokens revoked');
};

/**
 * Get all active sessions for a user
 */
export const getUserSessions = async (userId: string): Promise<RefreshTokenDocument[]> => {
  return RefreshTokenModel.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ lastUsedAt: -1 });
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (userId: string, sessionId: string): Promise<void> => {
  const result = await RefreshTokenModel.updateOne(
    {
      _id: sessionId,
      userId,
      isRevoked: false
    },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'User manually revoked session'
      }
    }
  );

  if (result.modifiedCount === 0) {
    throw new Error('Session not found or already revoked');
  }

  logger.info({ userId, sessionId }, 'Session revoked by user');
};

/**
 * Clean up expired tokens
 * Should be run periodically (e.g., daily cron job)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  const result = await RefreshTokenModel.deleteMany({
    expiresAt: { $lt: new Date() }
  });

  logger.info({ deletedCount: result.deletedCount }, 'Expired tokens cleaned up');
  return result.deletedCount;
};

/**
 * Get token statistics for monitoring
 */
export const getTokenStats = async (): Promise<{
  total: number;
  active: number;
  revoked: number;
  expired: number;
}> => {
  const now = new Date();

  const [total, active, revoked, expired] = await Promise.all([
    RefreshTokenModel.countDocuments(),
    RefreshTokenModel.countDocuments({ isRevoked: false, expiresAt: { $gt: now } }),
    RefreshTokenModel.countDocuments({ isRevoked: true }),
    RefreshTokenModel.countDocuments({ isRevoked: false, expiresAt: { $lte: now } })
  ]);

  return { total, active, revoked, expired };
};

export default {
  createRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeTokenFamily,
  revokeAllUserTokens,
  getUserSessions,
  revokeSession,
  cleanupExpiredTokens,
  getTokenStats
};
