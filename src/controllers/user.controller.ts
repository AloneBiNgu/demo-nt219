import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess, sendError } from '../utils/apiResponse';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUserById,
  getUserActivity
} from '../services/user.service';
import logger from '../utils/logger';

export const listUsersHandler = async (req: Request, res: Response) => {
  const { page = '1', limit = '20', role, search } = req.query;
  const users = await getAllUsers({
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
    role: role as string,
    search: search as string
  });
  return sendSuccess(res, StatusCodes.OK, users);
};

export const getUserHandler = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await getUserById(userId);
  if (!user) {
    return sendError(res, StatusCodes.NOT_FOUND, 'User not found');
  }
  return sendSuccess(res, StatusCodes.OK, user);
};

export const updateUserRoleHandler = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid role');
  }

  try {
    const adminId = req.authUser?.id;
    const metadata = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    };

    const user = await updateUserRole(userId, role, adminId!, metadata);
    if (!user) {
      return sendError(res, StatusCodes.NOT_FOUND, 'User not found');
    }
    logger.info({ userId, role, adminId }, 'User role updated');
    return sendSuccess(res, StatusCodes.OK, user);
  } catch (error) {
    logger.error({ err: error }, 'Failed to update user role');
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update user');
  }
};

export const deleteUserHandler = async (req: Request, res: Response) => {
  const { userId } = req.params;

  // Prevent self-deletion
  if (req.authUser?.id === userId) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Cannot delete your own account');
  }

  try {
    const adminId = req.authUser?.id;
    const metadata = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    };

    const deleted = await deleteUserById(userId, adminId!, metadata);
    if (!deleted) {
      return sendError(res, StatusCodes.NOT_FOUND, 'User not found');
    }
    logger.info({ userId, adminId }, 'User deleted');
    return sendSuccess(res, StatusCodes.OK, { message: 'User deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete user');
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete user');
  }
};

export const getUserActivityHandler = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const activity = await getUserActivity(userId);
  return sendSuccess(res, StatusCodes.OK, activity);
};
