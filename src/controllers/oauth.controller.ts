import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { signAccessToken, signRefreshToken, generateFingerprint } from '../utils/jwt';
import { createRefreshToken } from '../services/refreshToken.service';
import { UserDocument } from '../models/user.model';
import logger from '../utils/logger';
import { securityConfig } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

/**
 * OAuth Callback Handler
 * Called after successful Google authentication
 * Issues JWT tokens and redirects to frontend
 * 
 * Security implementation:
 * - Generate short-lived access token (15 mins)
 * - Generate long-lived refresh token (7 days)
 * - Store refresh token as httpOnly cookie
 * - Redirect to frontend with access token in URL (will be moved to memory)
 */
export const googleCallbackHandler = async (req: Request, res: Response) => {
  try {
    // Passport attaches authenticated user to req.user
    const user = req.user as UserDocument;

    if (!user) {
      logger.error('Google callback: No user attached to request');
      return res.redirect(`${securityConfig.clientOrigin}/login?error=auth_failed`);
    }

    logger.info(
      { userId: user._id, email: user.email },
      'Generating tokens for Google authenticated user'
    );

    // Extract device info
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                       req.socket.remoteAddress || 
                       'unknown';
    const fingerprint = generateFingerprint(userAgent, ipAddress);

    // Generate JWT tokens
    const accessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      fingerprint
    });

    const family = uuidv4();
    const refreshTokenString = signRefreshToken({
      sub: user._id.toString(),
      family,
      tokenVersion: user.tokenVersion
    });

    // Persist refresh token (hashed)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await createRefreshToken(
      refreshTokenString,
      user._id.toString(),
      {
        deviceId: 'google-oauth',
        deviceName: 'Google OAuth',
        userAgent,
        ipAddress
      },
      family,
      expiresAt
    );

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    logger.info(
      { userId: user._id },
      'Google OAuth authentication completed successfully'
    );

    // Redirect to frontend with access token
    // Frontend will extract token from URL and store in memory
    const redirectUrl = `${securityConfig.clientOrigin}/auth/callback?token=${accessToken}`;
    return res.redirect(redirectUrl);

  } catch (error) {
    logger.error({ err: error }, 'Google OAuth callback failed');
    return res.redirect(`${securityConfig.clientOrigin}/login?error=server_error`);
  }
};

/**
 * OAuth failure handler
 * Called when Google authentication fails
 */
export const googleFailureHandler = (req: Request, res: Response) => {
  logger.warn('Google OAuth authentication failed');
  return res.redirect(`${securityConfig.clientOrigin}/login?error=oauth_failed`);
};
