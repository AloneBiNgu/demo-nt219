import { UserModel, UserRole } from '../models/user.model';
import { OrderModel } from '../models/order.model';
import { CartModel } from '../models/cart.model';
import { logAuthEvent } from './audit.service';

interface UserFilters {
  page: number;
  limit: number;
  role?: string;
  search?: string;
}

interface UserActivity {
  userId: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  registeredAt: Date;
  orders: any[];
}

export const getAllUsers = async (filters: UserFilters) => {
  const { page, limit, role, search } = filters;
  const query: any = {};

  if (role) {
    query.role = role;
  }

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    UserModel.find(query)
      .select('-password -refreshTokenHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    UserModel.countDocuments(query)
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getUserById = async (userId: string) => {
  return UserModel.findById(userId).select('-password -refreshTokenHash');
};

export const updateUserRole = async (
  userId: string,
  role: UserRole,
  adminId: string,
  metadata?: { ip?: string; userAgent?: string }
) => {
  const oldUser = await UserModel.findById(userId).select('role email');
  const oldRole = oldUser?.role;

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select('-password -refreshTokenHash');
  
  if (user) {
    // Log admin action - using generic createAuditLog since we need custom eventType
    const { createAuditLog } = await import('./audit.service');
    await createAuditLog({
      eventType: 'admin.role_change',
      userId: adminId,
      action: 'update_role',
      resource: `user:${userId}`,
      metadata: {
        targetUserId: userId,
        targetEmail: oldUser?.email,
        oldRole,
        newRole: role,
        ip: metadata?.ip,
        userAgent: metadata?.userAgent
      },
      result: 'success',
      riskScore: 0
    });
  }

  return user;
};

export const deleteUserById = async (
  userId: string,
  adminId: string,
  metadata?: { ip?: string; userAgent?: string }
) => {
  const targetUser = await UserModel.findById(userId).select('email role');

  // Delete user's cart and orders first
  await Promise.all([
    CartModel.deleteMany({ user: userId }),
    // Note: You might want to keep orders for record-keeping
    // OrderModel.deleteMany({ user: userId })
  ]);

  const user = await UserModel.findByIdAndDelete(userId);

  if (user) {
    const { createAuditLog } = await import('./audit.service');
    await createAuditLog({
      eventType: 'admin.user_deleted',
      userId: adminId,
      action: 'delete_user',
      resource: `user:${userId}`,
      metadata: {
        targetUserId: userId,
        targetEmail: targetUser?.email,
        targetRole: targetUser?.role,
        ip: metadata?.ip,
        userAgent: metadata?.userAgent
      },
      result: 'success',
      riskScore: 10
    });
  }

  return user;
};

export const getUserActivity = async (userId: string): Promise<UserActivity | null> => {
  const user = await UserModel.findById(userId).select('-password -refreshTokenHash');
  if (!user) {
    return null;
  }

  const orders = await OrderModel.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(10);

  const paidOrders = orders.filter(order => order.status === 'paid' || order.status === 'shipped');
  const totalSpent = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const lastOrder = orders[0];

  return {
    userId: user._id.toString(),
    email: user.email,
    totalOrders: orders.length,
    totalSpent: Math.round(totalSpent * 100) / 100,
    lastOrderDate: lastOrder ? (lastOrder as any).createdAt : undefined,
    registeredAt: (user as any).createdAt,
    orders: orders.map(order => ({
      id: order._id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: (order as any).createdAt
    }))
  };
};
