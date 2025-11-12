import { Schema, model, HydratedDocument, CallbackWithoutResultAndOptionalError, Document, Model } from 'mongoose';
import { hashPassword, comparePassword } from '../utils/password';
import { encryptField, decryptField } from '../utils/encryption';

export type UserRole = 'user' | 'admin';
export type AuthProvider = 'local' | 'google' | 'oauth2';

export interface ITrustedDevice {
  deviceId: string;
  deviceName: string;
  userAgent: string;
  ipAddress: string;
  lastUsed: Date;
  trusted: boolean;
}

export interface ILoginHistory {
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  reason?: string;
  location?: string;
}

export interface IUser {
  email: string;
  password?: string; // Optional for OAuth users
  role: UserRole;
  provider: AuthProvider;
  googleId?: string;
  oauth2Id?: string; // Generic OAuth2 provider ID
  
  // Email verification
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  
  // Two-Factor Authentication
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  twoFactorBackupCodes?: string[]; // Hashed backup codes
  
  // Password management
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  lastPasswordChange?: Date;
  passwordHistory?: string[]; // Store last 5 password hashes to prevent reuse
  
  // Account security
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  trustedDevices: ITrustedDevice[];
  loginHistory: ILoginHistory[];
  
  // Token versioning (increment to invalidate all tokens)
  tokenVersion: number;
  
  // Profile
  displayName?: string;
  avatar?: string;
  
  // Timestamps added by mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDocumentMethods {
  comparePassword(candidate: string): Promise<boolean>;
  incrementFailedLogin(): Promise<void>;
  resetFailedLogin(): Promise<void>;
  isAccountLocked(): boolean;
  addToLoginHistory(entry: Omit<ILoginHistory, 'timestamp'>): Promise<void>;
  verifyBackupCode(code: string): Promise<boolean>;
  invalidateAllTokens(): Promise<void>;
  getDecryptedTrustedDevices(): ITrustedDevice[];
  getDecryptedLoginHistory(): ILoginHistory[];
}

export type UserDocument = HydratedDocument<IUser, UserDocumentMethods>;

type UserModelType = Model<IUser, Record<string, never>, UserDocumentMethods>;

const userSchema = new Schema<IUser, UserModelType, UserDocumentMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: function(this: IUser) {
        return this.provider === 'local';
      },
      minlength: 12,
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'oauth2'],
      default: 'local',
      required: true
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    oauth2Id: {
      type: String,
      unique: true,
      sparse: true
    },
    
    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      select: false
    },
    emailVerificationExpiry: {
      type: Date,
      select: false
    },
    
    // Two-Factor Authentication
    twoFactorSecret: {
      type: String,
      select: false
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorBackupCodes: {
      type: [String],
      select: false,
      default: []
    },
    
    // Password management
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpiry: {
      type: Date,
      select: false
    },
    lastPasswordChange: {
      type: Date
    },
    passwordHistory: {
      type: [String],
      select: false,
      default: []
    },
    
    // Account security
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    accountLockedUntil: {
      type: Date
    },
    trustedDevices: {
      type: [{
        deviceId: { type: String, required: true },
        deviceName: { type: String, required: true },
        userAgent: { type: String, required: true },
        ipAddress: { type: String, required: true },
        lastUsed: { type: Date, default: Date.now },
        trusted: { type: Boolean, default: false }
      }],
      default: [],
      select: false
    },
    loginHistory: {
      type: [{
        timestamp: { type: Date, default: Date.now },
        ipAddress: { type: String, required: true },
        userAgent: { type: String, required: true },
        success: { type: Boolean, required: true },
        reason: { type: String },
        location: { type: String }
      }],
      default: [],
      select: false
    },
    
    // Token versioning
    tokenVersion: {
      type: Number,
      default: 0
    },
    
    // Profile
    displayName: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: Document, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.twoFactorSecret;
        delete ret.twoFactorBackupCodes;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordHistory;
        delete ret.loginHistory;
        delete ret.trustedDevices;
        return ret;
      }
    }
  }
);

// Indexes for performance
userSchema.index({ email: 1, provider: 1 });
// Note: googleId already has unique:true, sparse:true in schema - no need for separate index
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

userSchema.pre('save', async function hashPasswordIfNeeded(this: UserDocument, next: CallbackWithoutResultAndOptionalError) {
  if (!this.password || !this.isModified('password')) {
    return next();
  }

  // Store in password history (keep last 5) before hashing new password
  if (this.isModified('password') && !this.isNew && this.password) {
    const passwordHistory = this.passwordHistory || [];
    // Don't add if it's already the current password
    const currentHash = await hashPassword(this.password);
    passwordHistory.unshift(currentHash);
    this.passwordHistory = passwordHistory.slice(0, 5);
    this.lastPasswordChange = new Date();
  }

  this.password = await hashPassword(this.password);
  next();
});

// Encrypt PII data before saving (GDPR compliance)
userSchema.pre('save', async function encryptPII(this: UserDocument, next: CallbackWithoutResultAndOptionalError) {
  try {
    // Encrypt trustedDevices PII
    if (this.isModified('trustedDevices') && this.trustedDevices && this.trustedDevices.length > 0) {
      this.trustedDevices = this.trustedDevices.map((device: ITrustedDevice) => {
        // Check if already encrypted (avoid double encryption)
        const isEncrypted = device.ipAddress?.includes(':') && device.ipAddress?.length > 50;
        if (isEncrypted) return device;
        
        return {
          ...device,
          ipAddress: encryptField(device.ipAddress) || device.ipAddress,
          userAgent: encryptField(device.userAgent) || device.userAgent
        };
      });
    }
    
    // Encrypt loginHistory PII
    if (this.isModified('loginHistory') && this.loginHistory && this.loginHistory.length > 0) {
      this.loginHistory = this.loginHistory.map((entry: ILoginHistory) => {
        // Check if already encrypted (avoid double encryption)
        const isEncrypted = entry.ipAddress?.includes(':') && entry.ipAddress?.length > 50;
        if (isEncrypted) return entry;
        
        return {
          ...entry,
          ipAddress: encryptField(entry.ipAddress) || entry.ipAddress,
          userAgent: encryptField(entry.userAgent) || entry.userAgent,
          location: entry.location ? (encryptField(entry.location) || entry.location) : entry.location
        } as ILoginHistory;
      });
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = function comparePasswordMethod(this: UserDocument, candidate: string) {
  if (!this.password) {
    return Promise.resolve(false);
  }
  return comparePassword(candidate, this.password);
};

userSchema.methods.incrementFailedLogin = async function(this: UserDocument): Promise<void> {
  this.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  
  await this.save();
};

userSchema.methods.resetFailedLogin = async function(this: UserDocument): Promise<void> {
  if (this.failedLoginAttempts > 0 || this.accountLockedUntil) {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = undefined;
    await this.save();
  }
};

userSchema.methods.isAccountLocked = function(this: UserDocument): boolean {
  return !!(this.accountLockedUntil && this.accountLockedUntil > new Date());
};

userSchema.methods.addToLoginHistory = async function(
  this: UserDocument,
  entry: Omit<ILoginHistory, 'timestamp'>
): Promise<void> {
  const historyEntry: ILoginHistory = {
    ...entry,
    timestamp: new Date()
  };
  
  this.loginHistory = this.loginHistory || [];
  this.loginHistory.unshift(historyEntry);
  
  // Keep only last 50 entries
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(0, 50);
  }
  
  await this.save();
};

userSchema.methods.verifyBackupCode = async function(this: UserDocument, code: string): Promise<boolean> {
  if (!this.twoFactorBackupCodes || this.twoFactorBackupCodes.length === 0) {
    return false;
  }
  
  for (let i = 0; i < this.twoFactorBackupCodes.length; i++) {
    const isMatch = await comparePassword(code, this.twoFactorBackupCodes[i]);
    if (isMatch) {
      // Remove used backup code
      this.twoFactorBackupCodes.splice(i, 1);
      await this.save();
      return true;
    }
  }
  
  return false;
};

userSchema.methods.invalidateAllTokens = async function(this: UserDocument): Promise<void> {
  this.tokenVersion += 1;
  await this.save();
};

// Decrypt PII data when needed for display (admin only)
userSchema.methods.getDecryptedTrustedDevices = function(this: UserDocument): ITrustedDevice[] {
  if (!this.trustedDevices || this.trustedDevices.length === 0) {
    return [];
  }
  
  return this.trustedDevices.map((device: ITrustedDevice) => {
    try {
      return {
        ...device,
        ipAddress: decryptField(device.ipAddress) || device.ipAddress,
        userAgent: decryptField(device.userAgent) || device.userAgent
      };
    } catch (error) {
      // If decryption fails, return encrypted data (backward compatibility)
      return device;
    }
  });
};

userSchema.methods.getDecryptedLoginHistory = function(this: UserDocument): ILoginHistory[] {
  if (!this.loginHistory || this.loginHistory.length === 0) {
    return [];
  }
  
  return this.loginHistory.map((entry: ILoginHistory) => {
    try {
      return {
        ...entry,
        ipAddress: decryptField(entry.ipAddress) || entry.ipAddress,
        userAgent: decryptField(entry.userAgent) || entry.userAgent,
        location: entry.location ? (decryptField(entry.location) || entry.location) : entry.location
      };
    } catch (error) {
      // If decryption fails, return encrypted data (backward compatibility)
      return entry;
    }
  });
};

export const UserModel = model<IUser, UserModelType>('User', userSchema);
