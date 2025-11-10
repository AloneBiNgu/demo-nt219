import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
  listUsersHandler,
  getUserHandler,
  updateUserRoleHandler,
  deleteUserHandler,
  getUserActivityHandler
} from '../controllers/user.controller';

const router = Router();

// All user management routes require admin access
router.get('/', authenticate, authorize('admin'), listUsersHandler);
router.get('/:userId', authenticate, authorize('admin'), getUserHandler);
router.patch('/:userId/role', authenticate, authorize('admin'), updateUserRoleHandler);
router.delete('/:userId', authenticate, authorize('admin'), deleteUserHandler);
router.get('/:userId/activity', authenticate, authorize('admin'), getUserActivityHandler);

export default router;
