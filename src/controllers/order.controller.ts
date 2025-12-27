import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { 
  listOrdersForUser, 
  listAllOrders, 
  updateOrderStatus, 
  getOrderDetails,
  getOrdersWithFilters,
  getOrderPaymentDetails 
} from '../services/order.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

export const listMyOrdersHandler = async (req: Request, res: Response) => {
  if (!req.authUser) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }
  const orders = await listOrdersForUser(req.authUser.id);
  return sendSuccess(res, StatusCodes.OK, { orders });
};

export const listAllOrdersHandler = async (req: Request, res: Response) => {
  const { page, limit, status, search } = req.query;
  
  const result = await getOrdersWithFilters({
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    status: status as string,
    search: search as string
  });
  
  return sendSuccess(res, StatusCodes.OK, result);
};

export const getOrderDetailsHandler = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = await getOrderDetails(orderId);
  
  if (!order) {
    return sendError(res, StatusCodes.NOT_FOUND, 'Order not found');
  }
  
  return sendSuccess(res, StatusCodes.OK, order);
};

export const updateOrderStatusHandler = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'processing', 'paid', 'shipped', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid order status');
  }
  
  try {
    const order = await updateOrderStatus(orderId, status);
    if (!order) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Order not found');
    }
    
    logger.info({ orderId, status }, 'Order status updated');
    return sendSuccess(res, StatusCodes.OK, order);
  } catch (error) {
    logger.error({ err: error }, 'Failed to update order status');
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update order');
  }
};

/**
 * DEV/TEST ONLY: Complete payment for testing without Stripe webhook
 * 
 * SECURITY: Multiple layers of protection:
 * 1. Environment check (NODE_ENV)
 * 2. Explicit DEV_FEATURES flag required
 * 3. Admin role required
 * 4. Audit logging
 */
export const completePaymentDevHandler = async (req: Request, res: Response) => {
  // SECURITY FIX: Multiple checks to prevent accidental exposure
  const isDevEnvironment = process.env.NODE_ENV !== 'production';
  const devFeaturesEnabled = process.env.ENABLE_DEV_FEATURES === 'true';
  const isAdmin = req.authUser?.role === 'admin';
  
  // Must be non-production AND have explicit flag AND be admin
  if (!isDevEnvironment || !devFeaturesEnabled) {
    logger.warn({
      userId: req.authUser?.id,
      ip: req.ip,
      env: process.env.NODE_ENV,
      devFeatures: devFeaturesEnabled
    }, 'Attempted access to dev payment endpoint in restricted environment');
    return sendError(res, StatusCodes.NOT_FOUND, 'Resource not found');
  }
  
  if (!isAdmin) {
    logger.warn({
      userId: req.authUser?.id,
      ip: req.ip
    }, 'Non-admin attempted access to dev payment endpoint');
    return sendError(res, StatusCodes.FORBIDDEN, 'Admin access required');
  }
  
  const { orderId } = req.params;
  
  try {
    const order = await updateOrderStatus(orderId, 'paid', req.authUser?.id);
    if (!order) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Order not found');
    }
    
    // Audit log for security tracking
    logger.warn({ 
      orderId, 
      adminId: req.authUser?.id,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }, '[DEV] Order manually marked as paid by admin - AUDIT');
    
    return sendSuccess(res, StatusCodes.OK, { message: 'Order marked as paid (dev mode)', order });
  } catch (error) {
    logger.error({ err: error }, 'Failed to complete payment');
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to complete payment');
  }
};

/**
 * Get payment details for a processing order to resume payment
 */
export const getOrderPaymentDetailsHandler = async (req: Request, res: Response) => {
  if (!req.authUser) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  const { orderId } = req.params;

  try {
    const paymentDetails = await getOrderPaymentDetails(orderId, req.authUser.id);
    
    if (!paymentDetails) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Order not found or payment already completed/expired');
    }

    return sendSuccess(res, StatusCodes.OK, paymentDetails);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get payment details');
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get payment details');
  }
};
