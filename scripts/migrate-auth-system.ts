/**
 * Database Migration Script
 * Run this to migrate existing users to new auth system
 * 
 * Usage: npx ts-node scripts/migrate-auth-system.ts
 */

import mongoose from 'mongoose';
import { UserModel } from '../src/models/user.model';
import { databaseConfig } from '../src/config/env';
import logger from '../src/utils/logger';

async function migrateAuthSystem() {
  try {
    // Connect to database
    await mongoose.connect(databaseConfig.uri);
    logger.info('Connected to database');

    // Update all users with new security fields
    const result = await UserModel.updateMany(
      {},
      {
        $set: {
          // Initialize token versioning
          tokenVersion: { $ifNull: ['$tokenVersion', 0] },
          
          // Initialize security fields
          failedLoginAttempts: { $ifNull: ['$failedLoginAttempts', 0] },
          twoFactorEnabled: { $ifNull: ['$twoFactorEnabled', false] },
          
          // Initialize arrays
          trustedDevices: { $ifNull: ['$trustedDevices', []] },
          loginHistory: { $ifNull: ['$loginHistory', []] },
          passwordHistory: { $ifNull: ['$passwordHistory', []] },
          twoFactorBackupCodes: { $ifNull: ['$twoFactorBackupCodes', []] }
        }
      }
    );

    logger.info({ modifiedCount: result.modifiedCount }, 'Updated users with new fields');

    // Auto-verify OAuth users
    const oauthResult = await UserModel.updateMany(
      { provider: { $ne: 'local' }, isEmailVerified: false },
      { $set: { isEmailVerified: true } }
    );

    logger.info({ modifiedCount: oauthResult.modifiedCount }, 'Auto-verified OAuth users');

    // Remove old refreshTokenHash field if exists
    await UserModel.updateMany(
      {},
      { $unset: { refreshTokenHash: '' } }
    );

    logger.info('Removed deprecated refreshTokenHash field');

    logger.info('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Migration failed');
    process.exit(1);
  }
}

// Run migration
migrateAuthSystem();
