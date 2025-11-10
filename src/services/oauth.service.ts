import { UserModel, UserDocument } from '../models/user.model';
import logger from '../utils/logger';
import { logAuthEvent } from './audit.service';

export interface GoogleUserData {
  googleId: string;
  email: string;
  displayName?: string;
  avatar?: string;
  isEmailVerified: boolean;
}

/**
 * Find existing user by Google ID or email, or create new user
 * Implements secure user provisioning for OAuth2 flow
 * 
 * Security considerations:
 * - Email verification is automatic for Google users
 * - No password required for OAuth users
 * - Handles account linking (same email, different providers)
 */
export const findOrCreateGoogleUser = async (
  googleData: GoogleUserData,
  metadata?: { ip?: string; userAgent?: string }
): Promise<UserDocument> => {
  try {
    // First, check if user exists with this Google ID
    let user = await UserModel.findOne({ googleId: googleData.googleId });

    if (user) {
      logger.info({ userId: user._id, email: user.email }, 'Existing Google user found');
      
      // Log OAuth login
      await logAuthEvent(
        'auth.login',
        user._id.toString(),
        {
          ip: metadata?.ip,
          userAgent: metadata?.userAgent,
          email: user.email,
          method: 'oauth_google'
        },
        'success'
      );
      
      // Update user info if changed
      let updated = false;
      if (user.displayName !== googleData.displayName) {
        user.displayName = googleData.displayName;
        updated = true;
      }
      if (user.avatar !== googleData.avatar) {
        user.avatar = googleData.avatar;
        updated = true;
      }
      
      if (updated) {
        await user.save();
        logger.info({ userId: user._id }, 'Google user profile updated');
      }
      
      return user;
    }

    // Check if user exists with same email but different provider
    user = await UserModel.findOne({ email: googleData.email });

    if (user) {
      // Link Google account to existing user
      logger.info(
        { userId: user._id, existingProvider: user.provider }, 
        'Linking Google account to existing user'
      );

      user.googleId = googleData.googleId;
      user.isEmailVerified = true; // Google email is always verified
      user.displayName = googleData.displayName;
      user.avatar = googleData.avatar;
      
      await user.save();
      
      // Log account linking
      await logAuthEvent(
        'auth.login',
        user._id.toString(),
        {
          ip: metadata?.ip,
          userAgent: metadata?.userAgent,
          email: user.email,
          method: 'oauth_google_linked'
        },
        'success'
      );
      
      logger.info({ userId: user._id }, 'Google account linked successfully');
      return user;
    }

    // Create new user
    user = new UserModel({
      email: googleData.email,
      provider: 'google',
      googleId: googleData.googleId,
      displayName: googleData.displayName,
      avatar: googleData.avatar,
      isEmailVerified: true,
      role: 'user'
      // No password needed for OAuth users
    });

    await user.save();

    // Log new user registration via OAuth
    await logAuthEvent(
      'auth.register',
      user._id.toString(),
      {
        ip: metadata?.ip,
        userAgent: metadata?.userAgent,
        email: user.email,
        method: 'oauth_google'
      },
      'success'
    );

    logger.info(
      { userId: user._id, email: user.email }, 
      'New Google user created'
    );

    return user;
  } catch (error) {
    logger.error({ err: error, googleData }, 'Failed to find or create Google user');
    throw error;
  }
};

/**
 * Check if email is already registered with a different provider
 * Used to show appropriate error message during OAuth flow
 */
export const checkEmailProvider = async (email: string): Promise<{
  exists: boolean;
  provider?: string;
}> => {
  const user = await UserModel.findOne({ email }).select('provider');
  
  if (!user) {
    return { exists: false };
  }

  return {
    exists: true,
    provider: user.provider
  };
};
