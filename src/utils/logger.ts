import pino from 'pino';
import { appConfig } from '../config/env';
import { redactSensitive } from './encryption';

const logger = pino({
  level: appConfig.isDev ? 'debug' : 'info',
  transport: appConfig.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard'
        }
      }
    : undefined,
  base: {
    env: appConfig.env
  },
  // Add serializers to automatically redact sensitive data
  serializers: {
    req: (req) => {
      // Redact sensitive headers and never log request body
      return redactSensitive({
        method: req.method,
        url: req.url,
        headers: {
          ...req.headers,
          authorization: req.headers?.authorization ? '[REDACTED]' : undefined,
          cookie: req.headers?.cookie ? '[REDACTED]' : undefined
        }
      });
    },
    res: (res) => {
      // Only log status code, never response body (may contain clientSecret)
      return {
        statusCode: res.statusCode
      };
    },
    err: pino.stdSerializers.err
  }
});

export default logger;
