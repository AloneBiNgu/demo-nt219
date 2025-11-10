import express from 'express';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import passport from './config/passport'; // Import passport configuration
import { stripeWebhookHandler } from './controllers/payment.controller';
import routes from './routes';
import { generalRateLimiter } from './middleware/rateLimiter';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { securityConfig, appConfig } from './config/env';
import logger from './utils/logger';

const app = express();

app.set('trust proxy', 1);

const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173'];
const configuredOrigins = securityConfig.clientOrigin
  ? securityConfig.clientOrigin.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0)
  : [];
const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins;

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const normalizedAllowedOrigins = allowedOrigins.map(o => o.endsWith('/') ? o.slice(0, -1) : o);

    if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    logger.warn({ origin, allowedOrigins }, 'Blocked CORS request from unauthorized origin');
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use(helmet());
app.use(hpp());
app.use(cookieParser());
app.use(generalRateLimiter);

// Initialize Passport for OAuth
app.use(passport.initialize());

app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), 'uploads'), {
    maxAge: appConfig.env === 'production' ? '7d' : 0,
    setHeaders: res => {
      const cacheHeader = appConfig.env === 'production' ? 'public, max-age=604800' : 'no-store';
      res.setHeader('Cache-Control', cacheHeader);
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
export const apiBasePath = '/api/v1';
