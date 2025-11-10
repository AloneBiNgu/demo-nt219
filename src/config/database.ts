import mongoose from 'mongoose';
import { databaseConfig } from './env';
import logger from '../utils/logger';

mongoose.set('strictQuery', true);

export const connectToDatabase = async (): Promise<typeof mongoose> => {
  try {
    const connection = await mongoose.connect(databaseConfig.uri);
    logger.info('Connected to MongoDB');
    return connection;
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to MongoDB');
    throw error;
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info('Disconnected from MongoDB');
};
