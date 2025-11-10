import { Schema, model, HydratedDocument, Types } from 'mongoose';

export interface IRefreshToken {
  tokenHash: string; // SHA-256 hash of the actual token
  userId: Types.ObjectId;
  
  // Device fingerprinting
  deviceId?: string; // Optional - may not always be available
  deviceName: string;
  userAgent: string;
  ipAddress: string;
  location?: string;
  
  // Token rotation tracking
  family: string; // UUID - tracks the rotation chain
  
  // Security
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  
  // Expiry
  expiresAt: Date;
  lastUsedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RefreshTokenDocument = HydratedDocument<IRefreshToken>;

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    deviceId: {
      type: String,
      required: false // Optional - may not always be available (e.g., OAuth)
    },
    deviceName: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String,
      required: true
    },
    location: {
      type: String
    },
    family: {
      type: String,
      required: true,
      index: true
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    revokedAt: {
      type: Date
    },
    revokedReason: {
      type: String
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ family: 1, isRevoked: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Clean up expired tokens (run daily)
refreshTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days

export const RefreshTokenModel = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
