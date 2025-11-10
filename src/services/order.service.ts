import { Types } from 'mongoose';
import { OrderModel, OrderDocument, IOrderItem, OrderStatus } from '../models/order.model';
import { logOrderEvent } from './audit.service';
import { detectHighValueOrderAnomaly, detectRapidOrderCreation } from './anomaly.service';
import sanitize from 'mongo-sanitize';
import logger from '../utils/logger';

export interface CreateOrderInput {
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  currency: string;
  paymentIntentId?: string;
}

export const createOrder = async (input: CreateOrderInput, metadata?: { ip?: string; userAgent?: string; shippingAddress?: string }): Promise<OrderDocument> => {
  // Run fraud checks before creating order
  const [highValueCheck, rapidCreationCheck] = await Promise.all([
    detectHighValueOrderAnomaly(
      input.userId,
      input.totalAmount,
      metadata?.shippingAddress || 'Not provided'
    ),
    detectRapidOrderCreation(input.userId)
  ]);

  const combinedRiskScore = Math.max(highValueCheck.riskScore, rapidCreationCheck.riskScore);
  const allReasons = [...highValueCheck.reasons, ...rapidCreationCheck.reasons];

  if (combinedRiskScore >= 70) {
    logger.warn({
      userId: input.userId,
      amount: input.totalAmount,
      riskScore: combinedRiskScore,
      reasons: allReasons
    }, 'High-risk order creation attempt');
  }

  const order = new OrderModel({
    user: new Types.ObjectId(input.userId),
    items: input.items,
    totalAmount: input.totalAmount,
    currency: input.currency,
    paymentIntentId: input.paymentIntentId,
    status: 'pending'
  });

  const savedOrder = await order.save();

  // Audit log: Order created
  await logOrderEvent(
    'order.created',
    input.userId,
    savedOrder._id.toString(),
    undefined,
    {
      ip: metadata?.ip,
      userAgent: metadata?.userAgent,
      totalAmount: input.totalAmount,
      shippingAddress: metadata?.shippingAddress
    },
    'success'
  );

  return savedOrder;
};

export const updateOrderStatusByPaymentIntent = async (
  paymentIntentId: string,
  status: OrderStatus
): Promise<OrderDocument | null> => {
  return OrderModel.findOneAndUpdate(
    { paymentIntentId },
    { status },
    { new: true }
  );
};

export const findOrderByPaymentIntent = async (paymentIntentId: string): Promise<OrderDocument | null> => {
  return OrderModel.findOne({ paymentIntentId });
};

export const listOrdersForUser = async (userId: string): Promise<OrderDocument[]> => {
  return OrderModel.find({ user: userId }).sort({ createdAt: -1 });
};

export const listAllOrders = async (): Promise<OrderDocument[]> => {
  return OrderModel.find().sort({ createdAt: -1 });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus, userId?: string) => {
  const existingOrder = await OrderModel.findById(orderId);
  if (!existingOrder) {
    throw new Error('Order not found');
  }

  const changes = {
    before: { status: existingOrder.status },
    after: { status }
  };

  const order = await OrderModel.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  );

  if (order && userId) {
    // Audit log: Order status updated
    await logOrderEvent(
      'order.updated',
      userId,
      orderId,
      changes,
      {
        totalAmount: order.totalAmount
      },
      'success'
    );
  }

  return order;
};

export const getOrderDetails = async (orderId: string) => {
  const order = await OrderModel.findById(orderId).populate('user', 'email displayName');
  return order;
};

export const getOrdersWithFilters = async (filters: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const { page = 1, limit = 20, status, search } = filters;
  
  // Validate status against enum to prevent NoSQL injection
  const validStatuses: OrderStatus[] = ['pending', 'processing', 'paid', 'shipped', 'cancelled'];
  const query: any = {};

  if (status && status !== 'all') {
    // Sanitize and validate status parameter
    const sanitizedStatus = sanitize(status) as string;
    if (!validStatuses.includes(sanitizedStatus as OrderStatus)) {
      throw new Error('Invalid order status parameter');
    }
    query.status = sanitizedStatus;
  }
  
  // Sanitize search parameter to prevent injection
  if (search) {
    const sanitizedSearch = sanitize(search);
    // You could add text search here if needed
    // query.$text = { $search: sanitizedSearch };
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    OrderModel.find(query)
      .populate('user', 'email displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    OrderModel.countDocuments(query)
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get order with clientSecret for resuming payment
 * Only returns clientSecret if order is in 'processing' status
 */
export const getOrderPaymentDetails = async (orderId: string, userId: string) => {
  const order = await OrderModel.findOne({
    _id: orderId,
    user: userId,
    status: 'processing'
  }).select('+clientSecret');

  if (!order) {
    return null;
  }

  // Check if order is expired (>24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (order.createdAt && order.createdAt < twentyFourHoursAgo) {
    // Auto-cancel expired order
    order.status = 'cancelled';
    await order.save();
    return null;
  }

  // Validate clientSecret exists
  if (!order.clientSecret || !order.paymentIntentId) {
    throw new Error('Payment information not found for this order');
  }

  // Check PaymentIntent status
  const stripe = require('stripe')(require('../config/env').stripeConfig.secretKey);
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
  } catch (err) {
    paymentIntent = null;
  }

  if (!paymentIntent || ['succeeded', 'canceled', 'requires_payment_method'].includes(paymentIntent.status)) {
    // Create new PaymentIntent
    const newIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100),
      currency: order.currency,
      metadata: {
        orderId: order.id,
        userId: order.user.toString()
      },
      automatic_payment_methods: { enabled: true }
    });
    order.paymentIntentId = newIntent.id;
    order.clientSecret = newIntent.client_secret ?? undefined;
    await order.save();
    return {
      orderId: order.id,
      clientSecret: newIntent.client_secret,
      totalAmount: order.totalAmount,
      currency: order.currency,
      items: order.items,
      createdAt: order.createdAt
    };
  }

  return {
    orderId: order.id,
    clientSecret: order.clientSecret,
    totalAmount: order.totalAmount,
    currency: order.currency,
    items: order.items,
    createdAt: order.createdAt
  };
};
