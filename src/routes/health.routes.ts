import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * Health check endpoint
 * Used by Docker healthcheck and monitoring tools
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    // If database is not connected, return 503
    if (dbStatus !== 'connected') {
      return res.status(503).json({
        ...health,
        status: 'unhealthy',
        message: 'Database is not connected'
      });
    }

    return res.status(200).json(health);
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: (error as Error).message
    });
  }
});

/**
 * Readiness probe
 * Returns 200 only when app is fully ready to serve traffic
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check if MongoDB is ready
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        ready: false,
        message: 'Database not ready'
      });
    }

    return res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      ready: false,
      error: (error as Error).message
    });
  }
});

/**
 * Liveness probe
 * Returns 200 as long as app is alive (even if not ready)
 */
router.get('/alive', (_req: Request, res: Response) => {
  return res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

export default router;
