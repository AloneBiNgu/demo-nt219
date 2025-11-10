import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createPaymentIntent as createStripePaymentIntent, constructStripeEvent, handleStripeEvent } from '../services/payment.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

export const createPaymentIntentHandler = async (req: Request, res: Response) => {
  if (!req.authUser) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated');
  }

  try {
    const { clientSecret, orderId, paymentIntentId } = await createStripePaymentIntent(
      req.authUser.id,
      req.body.items,
      {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      }
    );
    return sendSuccess(res, StatusCodes.CREATED, {
      clientSecret,
      orderId,
      paymentIntentId
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create Stripe PaymentIntent');
    return sendError(res, StatusCodes.BAD_REQUEST, (error as Error).message);
  }
};

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  logger.info('Stripe webhook received');
  const signature = req.headers['stripe-signature'];

  if (!signature || typeof signature !== 'string') {
    logger.warn('Stripe webhook called without signature');
    return res.status(StatusCodes.BAD_REQUEST).send('Missing Stripe signature');
  }

  try {
    const event = constructStripeEvent(req.body, signature);
    logger.info({ type: event.type, id: event.id }, 'Processing Stripe webhook event');
    await handleStripeEvent(event);
    logger.info({ type: event.type, id: event.id }, 'Stripe webhook event processed successfully');
    return res.status(StatusCodes.OK).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, 'Stripe webhook signature verification failed');
    return res.status(StatusCodes.BAD_REQUEST).send(`Webhook Error: ${(error as Error).message}`);
  }
};
