import { Router } from 'express';
import { 
  listMyOrdersHandler, 
  listAllOrdersHandler, 
  getOrderDetailsHandler, 
  updateOrderStatusHandler,
  completePaymentDevHandler,
  getOrderPaymentDetailsHandler 
} from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/me', authenticate, listMyOrdersHandler);
router.get('/', authenticate, authorize('admin'), listAllOrdersHandler);
router.get('/:orderId', authenticate, authorize('admin'), getOrderDetailsHandler);
router.patch('/:orderId/status', authenticate, authorize('admin'), updateOrderStatusHandler);

// Get payment details to resume payment for processing orders
router.get('/:orderId/payment-details', authenticate, getOrderPaymentDetailsHandler);

// DEV ONLY: Complete payment without webhook (for testing in development)
router.post('/:orderId/complete-payment-dev', authenticate, completePaymentDevHandler);

export default router;
