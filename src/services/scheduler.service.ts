import cron from 'node-cron';
import { OrderModel } from '../models/order.model';
import logger from '../utils/logger';

/**
 * Auto-cancel orders that have been in 'processing' status for more than 24 hours
 */
export const startOrderExpirationJob = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const result = await OrderModel.updateMany(
        {
          status: 'processing',
          createdAt: { $lt: twentyFourHoursAgo }
        },
        {
          $set: { status: 'cancelled' }
        }
      );

      if (result.modifiedCount > 0) {
        logger.info(
          { count: result.modifiedCount },
          'Auto-cancelled expired orders'
        );
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to auto-cancel expired orders');
    }
  });

  logger.info('Order expiration job started (runs every hour)');
};

/**
 * Manually cancel expired orders (for testing or manual execution)
 */
export const cancelExpiredOrders = async (): Promise<number> => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const result = await OrderModel.updateMany(
    {
      status: 'processing',
      createdAt: { $lt: twentyFourHoursAgo }
    },
    {
      $set: { status: 'cancelled' }
    }
  );

  return result.modifiedCount;
};
