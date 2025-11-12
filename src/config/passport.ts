import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { env } from './env';
import { findOrCreateOAuth2User } from '../services/oauth.service';
import logger from '../utils/logger';

/**
 * Generic OAuth2 Strategy Configuration
 * Supports any OAuth2 provider (GitHub, GitLab, Keycloak, etc.)
 */
if (env.OAUTH2_CLIENT_ID && env.OAUTH2_CLIENT_SECRET) {
  passport.use('oauth2', new OAuth2Strategy(
    {
      authorizationURL: env.OAUTH2_AUTHORIZATION_URL || '',
      tokenURL: env.OAUTH2_TOKEN_URL || '',
      clientID: env.OAUTH2_CLIENT_ID,
      clientSecret: env.OAUTH2_CLIENT_SECRET,
      callbackURL: env.OAUTH2_CALLBACK_URL,
      scope: env.OAUTH2_SCOPE?.split(',') || ['openid', 'profile', 'email'],
      passReqToCallback: true
    },
    async (
      req: Express.Request,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: VerifyCallback
    ) => {
      try {
        // Fetch user profile from OAuth2 provider
        const userProfileUrl = env.OAUTH2_USER_PROFILE_URL || '';
        const response = await fetch(userProfileUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile from OAuth2 provider');
        }

        const userProfile = await response.json() as any;

        logger.info(
          { 
            sub: userProfile.sub || userProfile.id,
            email: userProfile.email 
          }, 
          'OAuth2 callback received'
        );

        // Map OAuth2 profile to our user data structure
        const oauth2Data = {
          oauth2Id: userProfile.sub || userProfile.id || userProfile.login,
          email: userProfile.email || userProfile.email_address,
          displayName: userProfile.name || userProfile.display_name || userProfile.login,
          avatar: userProfile.picture || userProfile.avatar_url,
          isEmailVerified: userProfile.email_verified || false
        };

        // Validate required fields
        if (!oauth2Data.oauth2Id) {
          logger.error({ userProfile }, 'OAuth2 profile missing user ID');
          return done(new Error('User ID not provided by OAuth2 provider'), undefined);
        }

        if (!oauth2Data.email) {
          logger.error({ userProfile }, 'OAuth2 profile missing email');
          return done(new Error('Email not provided by OAuth2 provider'), undefined);
        }

        // Find or create user
        const expressReq = req as any;
        const metadata = {
          ip: expressReq.ip || expressReq.connection?.remoteAddress,
          userAgent: expressReq.get?.('user-agent')
        };
        
        const user = await findOrCreateOAuth2User(oauth2Data, metadata);

        logger.info(
          { 
            userId: user._id, 
            email: user.email,
            provider: user.provider
          }, 
          'User authenticated via OAuth2'
        );

        return done(null, user);
      } catch (error) {
        logger.error({ err: error }, 'OAuth2 authentication failed');
        return done(error as Error, undefined);
      }
    }
  ));
}

/**
 * GitHub OAuth2 Strategy
 */
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  passport.use('github', new OAuth2Strategy(
    {
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: env.GITHUB_CALLBACK_URL,
      scope: ['user:email', 'read:user'],
      passReqToCallback: true
    },
    async (
      req: Express.Request,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: VerifyCallback
    ) => {
      try {
        // Fetch user profile from GitHub
        const response = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch GitHub user profile');
        }

        const githubProfile: any = await response.json();

        // Fetch user emails (GitHub requires separate endpoint)
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        let email = githubProfile.email;
        if (!email && emailResponse.ok) {
          const emails = await emailResponse.json() as any[];
          const primaryEmail = emails.find(e => e.primary && e.verified);
          email = primaryEmail?.email || emails[0]?.email;
        }

        logger.info(
          { 
            githubId: githubProfile.id,
            login: githubProfile.login,
            email 
          }, 
          'GitHub OAuth callback received'
        );

        const oauth2Data = {
          oauth2Id: `github_${githubProfile.id}`,
          email: email || `${githubProfile.login}@github.local`,
          displayName: githubProfile.name || githubProfile.login,
          avatar: githubProfile.avatar_url,
          isEmailVerified: email ? true : false
        };

        if (!email) {
          logger.warn({ githubProfile }, 'GitHub user has no public email');
        }

        const expressReq = req as any;
        const metadata = {
          ip: expressReq.ip || expressReq.connection?.remoteAddress,
          userAgent: expressReq.get?.('user-agent')
        };
        
        const user = await findOrCreateOAuth2User(oauth2Data, metadata);

        logger.info(
          { 
            userId: user._id, 
            email: user.email,
            provider: 'github'
          }, 
          'User authenticated via GitHub'
        );

        return done(null, user);
      } catch (error) {
        logger.error({ err: error }, 'GitHub OAuth authentication failed');
        return done(error as Error, undefined);
      }
    }
  ));
}

/**
 * Discord OAuth2 Strategy
 */
if (env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET) {
  passport.use('discord', new OAuth2Strategy(
    {
      authorizationURL: 'https://discord.com/api/oauth2/authorize',
      tokenURL: 'https://discord.com/api/oauth2/token',
      clientID: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      callbackURL: env.DISCORD_CALLBACK_URL,
      scope: ['identify', 'email'],
      passReqToCallback: true
    },
    async (
      req: Express.Request,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: VerifyCallback
    ) => {
      try {
        // Fetch user profile from Discord
        const response = await fetch('https://discord.com/api/users/@me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch Discord user profile');
        }

        const discordProfile: any = await response.json();

        logger.info(
          { 
            discordId: discordProfile.id,
            username: discordProfile.username,
            email: discordProfile.email 
          }, 
          'Discord OAuth callback received'
        );

        const oauth2Data = {
          oauth2Id: `discord_${discordProfile.id}`,
          email: discordProfile.email || `${discordProfile.username}@discord.local`,
          displayName: discordProfile.global_name || discordProfile.username,
          avatar: discordProfile.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
            : undefined,
          isEmailVerified: discordProfile.verified || false
        };

        if (!discordProfile.email) {
          logger.warn({ discordProfile }, 'Discord user has no email');
        }

        const expressReq = req as any;
        const metadata = {
          ip: expressReq.ip || expressReq.connection?.remoteAddress,
          userAgent: expressReq.get?.('user-agent')
        };
        
        const user = await findOrCreateOAuth2User(oauth2Data, metadata);

        logger.info(
          { 
            userId: user._id, 
            email: user.email,
            provider: 'discord'
          }, 
          'User authenticated via Discord'
        );

        return done(null, user);
      } catch (error) {
        logger.error({ err: error }, 'Discord OAuth authentication failed');
        return done(error as Error, undefined);
      }
    }
  ));
}

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
