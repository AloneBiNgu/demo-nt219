import http from 'http';
import app from './app';
import { connectToDatabase, disconnectFromDatabase } from './config/database';
import { appConfig, adminConfig, vaultConfig } from './config/env';
import { initializeVault, startTokenRenewal, vaultClient } from './config/vault';
import logger from './utils/logger';
import { UserModel } from './models/user.model';
import { startOrderExpirationJob } from './services/scheduler.service';

const server = http.createServer(app);

const ensureAdminUser = async () => {
  if (!adminConfig.email || !adminConfig.password) {
    logger.warn('Admin credentials not provided. Skipping admin bootstrap.');
    return;
  }

  const existingAdmin = await UserModel.findOne({ email: adminConfig.email });
  if (!existingAdmin) {
    await UserModel.create({
      email: adminConfig.email,
      password: adminConfig.password,
      role: 'admin'
    });
    logger.info('Default admin user created');
  } else if (existingAdmin.role !== 'admin') {
    existingAdmin.role = 'admin';
    await existingAdmin.save();
    logger.info('Existing user promoted to admin');
  }
};

const start = async () => {
  try {
    // Initialize Vault (if enabled)
    if (vaultConfig.enabled) {
      logger.info('Initializing Vault for secret management...');
      try {
        await initializeVault();
        startTokenRenewal(30); // Renew token every 30 minutes
        
        const isHealthy = await vaultClient.healthCheck();
        logger.info({ healthy: isHealthy }, 'Vault health check completed');
      } catch (vaultError) {
        logger.warn({ err: vaultError }, 'Vault initialization failed, falling back to .env');
      }
    }
    
    await connectToDatabase();
    await ensureAdminUser();
    
    // Start scheduled jobs
    startOrderExpirationJob();

    server.listen(appConfig.port, () => {
      logger.info(`Server running on port ${appConfig.port}`);
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutting down server');
  server.close(async (closeError?: Error) => {
    if (closeError) {
      logger.error({ err: closeError }, 'Error during HTTP server close');
      process.exit(1);
    }
    await disconnectFromDatabase();
    process.exit(0);
  });
};

['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => shutdown(signal));
});

start();
