import { Router } from 'express';
import passport from '../config/passport';
import { googleCallbackHandler, googleFailureHandler } from '../controllers/oauth.controller';

const router = Router();

/**
 * Initiate Google OAuth flow
 * Redirects user to Google consent screen
 * 
 * @route GET /api/v1/auth/google
 * @access Public
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false // We use JWT, not sessions
  })
);

/**
 * Google OAuth callback
 * Called after user authorizes on Google
 * Issues JWT tokens and redirects to frontend
 * 
 * @route GET /api/v1/auth/google/callback
 * @access Public (but requires valid Google OAuth state)
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/v1/auth/google/failure'
  }),
  googleCallbackHandler
);

/**
 * Google OAuth failure handler
 * 
 * @route GET /api/v1/auth/google/failure
 * @access Public
 */
router.get('/google/failure', googleFailureHandler);

export default router;
