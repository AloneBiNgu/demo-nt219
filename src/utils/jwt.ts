import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { authConfig } from '../config/env';
import type { AccessTokenPayload, RefreshTokenPayload } from '../types';

/**
 * Generate device fingerprint from user-agent and other data
 */
export const generateFingerprint = (userAgent: string, ipAddress: string): string => {
  return crypto
    .createHash('sha256')
    .update(`${userAgent}:${ipAddress}`)
    .digest('hex');
};

/**
 * Sign Access Token with enhanced security
 */
interface AccessTokenInput {
  sub: string; // userId
  email: string;
  role: string;
  tokenVersion: number;
  fingerprint?: string;
}

export const signAccessToken = (payload: AccessTokenInput): string => {
  const jti = uuid(); // Unique token ID
  const secret: Secret = authConfig.accessToken.secret;
  const options: SignOptions = {
    expiresIn: authConfig.accessToken.expiresIn as SignOptions['expiresIn']
  };

  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
      fingerprint: payload.fingerprint,
      jti
    },
    secret,
    options
  );
};

/**
 * Sign Refresh Token
 */
interface RefreshTokenInput {
  sub: string; // userId
  family: string; // Token family for rotation tracking
  tokenVersion: number;
}

export const signRefreshToken = (payload: RefreshTokenInput): string => {
  const secret: Secret = authConfig.refreshToken.secret;
  const options: SignOptions = {
    expiresIn: authConfig.refreshToken.expiresIn as SignOptions['expiresIn']
  };

  return jwt.sign(
    {
      sub: payload.sub,
      family: payload.family,
      tokenVersion: payload.tokenVersion,
      type: 'refresh'
    },
    secret,
    options
  );
};

/**
 * Verify Access Token with fingerprint validation
 */
export const verifyAccessToken = (
  token: string,
  fingerprint?: string
): AccessTokenPayload => {
  const secret: Secret = authConfig.accessToken.secret;
  const payload = jwt.verify(token, secret) as AccessTokenPayload;

  // Validate fingerprint if provided
  if (fingerprint && payload.fingerprint && payload.fingerprint !== fingerprint) {
    throw new Error('Token fingerprint mismatch');
  }

  return payload;
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const secret: Secret = authConfig.refreshToken.secret;
  return jwt.verify(token, secret) as RefreshTokenPayload;
};

/**
 * Hash token for storage (SHA-256)
 * Never store raw tokens in database!
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate secure random token for email verification, password reset, etc.
 */
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Decode token without verification (for debugging/logging)
 */
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  generateSecureToken,
  generateFingerprint,
  decodeToken
};
