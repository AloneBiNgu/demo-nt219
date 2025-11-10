import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { env } from './env';
import { findOrCreateGoogleUser } from '../services/oauth.service';
import logger from '../utils/logger';

/**
 * Google OAuth2 Strategy Configuration
 * Implements OAuth2 authentication as per security requirement 5.1
 * 
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Redirect to Google consent screen
 * 3. Google redirects back with authorization code
 * 4. Exchange code for user profile
 * 5. Find or create user in database
 * 6. Issue JWT tokens
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID || 'dummy-client-id',
      clientSecret: env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
      passReqToCallback: true
    },
    async (
      req: Express.Request,
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        logger.info(
          { 
            googleId: profile.id, 
            email: profile.emails?.[0]?.value 
          }, 
          'Google OAuth callback received'
        );

        // Extract user data from Google profile
        const googleData = {
          googleId: profile.id,
          email: profile.emails?.[0]?.value || '',
          displayName: profile.displayName,
          avatar: profile.photos?.[0]?.value,
          isEmailVerified: profile.emails?.[0]?.verified || false
        };

        // Validate required fields
        if (!googleData.email) {
          logger.error({ profile }, 'Google profile missing email');
          return done(new Error('Email not provided by Google'), undefined);
        }

        // Find or create user with metadata
        const expressReq = req as any;
        const metadata = {
          ip: expressReq.ip || expressReq.connection?.remoteAddress,
          userAgent: expressReq.get?.('user-agent')
        };
        const user = await findOrCreateGoogleUser(googleData, metadata);

        logger.info(
          { 
            userId: user._id, 
            email: user.email,
            provider: user.provider
          }, 
          'User authenticated via Google OAuth'
        );

        return done(null, user);
      } catch (error) {
        logger.error({ err: error }, 'Google OAuth authentication failed');
        return done(error as Error, undefined);
      }
    }
  )
);

/**
 * Serialize user to session
 * Only store user ID to keep session lightweight
 */
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as any)._id.toString());
});

/**
 * Deserialize user from session
 * Note: In JWT-based auth, we don't actually use sessions
 * This is here for compatibility but can be simplified
 */
passport.deserializeUser((id: string, done) => {
  done(null, { id });
});

export default passport;
