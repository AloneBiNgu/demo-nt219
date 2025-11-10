import { Router } from 'express';
import {
  createProductHandler,
  listProductsHandler,
  getProductHandler,
  updateProductHandler,
  deleteProductHandler,
  uploadPrototypeImageHandler
} from '../controllers/product.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { productIdParamSchema } from '../validators/common.validator';
import { prototypeUpload } from '../middleware/prototypeUpload';

const router = Router();

router.get('/', listProductsHandler);
router.get('/:productId', validateRequest(productIdParamSchema, 'params'), getProductHandler);
router.post('/', authenticate, authorize('admin'), validateRequest(createProductSchema), createProductHandler);
router.put(
  '/:productId',
  authenticate,
  authorize('admin'),
  validateRequest(productIdParamSchema, 'params'),
  validateRequest(updateProductSchema),
  updateProductHandler
);
router.delete(
  '/:productId',
  authenticate,
  authorize('admin'),
  validateRequest(productIdParamSchema, 'params'),
  deleteProductHandler
);

router.post(
  '/:productId/prototype-image',
  authenticate,
  authorize('admin'),
  validateRequest(productIdParamSchema, 'params'),
  prototypeUpload.single('prototypeImage'),
  uploadPrototypeImageHandler
);

export default router;
