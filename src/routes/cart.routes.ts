import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  getCartHandler,
  addToCartHandler,
  updateCartItemHandler,
  removeFromCartHandler,
  clearCartHandler
} from '../controllers/cart.controller';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeFromCartSchema
} from '../validators/cart.validator';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

router.get('/', getCartHandler);
router.post('/add', validateRequest(addToCartSchema), addToCartHandler);
router.put('/update', validateRequest(updateCartItemSchema), updateCartItemHandler);
router.delete('/remove', validateRequest(removeFromCartSchema), removeFromCartHandler);
router.delete('/clear', clearCartHandler);

export default router;
