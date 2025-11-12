import { Router } from 'express';
import passport from '../config/passport';
import { 
  oauth2CallbackHandler, 
  oauth2FailureHandler,
  githubCallbackHandler,
  githubFailureHandler,
  discordCallbackHandler,
  discordFailureHandler
} from '../controllers/oauth.controller';

const router = Router();

/**
 * Initiate Generic OAuth2 flow
 * Redirects user to OAuth2 provider consent screen
 * 
 * @route GET /api/v1/auth/oauth2
 * @access Public
 */
router.get(
  '/oauth2',
  passport.authenticate('oauth2', {
    session: false
  })
);

/**
 * Generic OAuth2 callback
 * Called after user authorizes on OAuth2 provider
 * Issues JWT tokens and redirects to frontend
 * 
 * @route GET /api/v1/auth/oauth2/callback
 * @access Public
 */
router.get(
  '/oauth2/callback',
  passport.authenticate('oauth2', {
    session: false,
    failureRedirect: '/api/v1/auth/oauth2/failure'
  }),
  oauth2CallbackHandler
);

/**
 * Generic OAuth2 failure handler
 * 
 * @route GET /api/v1/auth/oauth2/failure
 * @access Public
 */
router.get('/oauth2/failure', oauth2FailureHandler);

/**
 * Initiate GitHub OAuth flow
 * 
 * @route GET /api/v1/oauth/github
 * @access Public
 */
router.get(
  '/github',
  passport.authenticate('github', {
    session: false
  })
);

/**
 * GitHub OAuth callback
 * 
 * @route GET /api/v1/oauth/github/callback
 * @access Public
 */
router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: '/api/v1/oauth/github/failure'
  }),
  githubCallbackHandler
);

/**
 * GitHub OAuth failure handler
 * 
 * @route GET /api/v1/oauth/github/failure
 * @access Public
 */
router.get('/github/failure', githubFailureHandler);

/**
 * Initiate Discord OAuth flow
 * 
 * @route GET /api/v1/oauth/discord
 * @access Public
 */
router.get(
  '/discord',
  passport.authenticate('discord', {
    session: false
  })
);

/**
 * Discord OAuth callback
 * 
 * @route GET /api/v1/oauth/discord/callback
 * @access Public
 */
router.get(
  '/discord/callback',
  passport.authenticate('discord', {
    session: false,
    failureRedirect: '/api/v1/oauth/discord/failure'
  }),
  discordCallbackHandler
);

/**
 * Discord OAuth failure handler
 * 
 * @route GET /api/v1/oauth/discord/failure
 * @access Public
 */
router.get('/discord/failure', discordFailureHandler);

export default router;
