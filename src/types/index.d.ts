import { JwtPayload } from 'jsonwebtoken';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
  fingerprint?: string;
  ip?: string; // Store IP for device verification
  jti: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  family: string;
  tokenVersion: number;
  type: 'refresh';
}

export interface DeviceInfo {
  deviceId?: string;
  deviceName: string;
  userAgent: string;
  ipAddress: string;
  location?: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
        role: string;
        tokenVersion: number;
      };
      deviceInfo?: DeviceInfo;
      fingerprint?: string;
    }
  }
}
