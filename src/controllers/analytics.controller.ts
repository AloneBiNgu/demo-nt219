import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess } from '../utils/apiResponse';
import { 
  getDashboardStats, 
  getSalesAnalytics, 
  getRevenueAnalytics,
  getTopProducts,
  getRecentActivity
} from '../services/analytics.service';

export const getDashboardStatsHandler = async (_req: Request, res: Response) => {
  const stats = await getDashboardStats();
  return sendSuccess(res, StatusCodes.OK, stats);
};

export const getSalesAnalyticsHandler = async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;
  const analytics = await getSalesAnalytics(period as string);
  return sendSuccess(res, StatusCodes.OK, analytics);
};

export const getRevenueAnalyticsHandler = async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;
  const analytics = await getRevenueAnalytics(period as string);
  return sendSuccess(res, StatusCodes.OK, analytics);
};

export const getTopProductsHandler = async (req: Request, res: Response) => {
  const { limit = '10' } = req.query;
  const products = await getTopProducts(parseInt(limit as string, 10));
  return sendSuccess(res, StatusCodes.OK, products);
};

export const getRecentActivityHandler = async (req: Request, res: Response) => {
  const { limit = '20' } = req.query;
  const activity = await getRecentActivity(parseInt(limit as string, 10));
  return sendSuccess(res, StatusCodes.OK, activity);
};
