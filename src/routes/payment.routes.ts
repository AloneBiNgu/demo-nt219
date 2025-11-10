import { Router } from 'express';
import { createPaymentIntentHandler, stripeWebhookHandler } from '../controllers/payment.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { createPaymentIntentSchema } from '../validators/payment.validator';
import { strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// STRICT RATE LIMIT: Only 3 payment attempts per 15 minutes
router.post('/create-intent', authenticate, strictRateLimiter, validateRequest(createPaymentIntentSchema), createPaymentIntentHandler);

// Note: Stripe webhook is registered directly in app.ts with raw body parsing
// app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

export default router;
