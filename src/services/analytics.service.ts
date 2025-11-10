import { UserModel } from '../models/user.model';
import { ProductModel } from '../models/product.model';
import { OrderModel } from '../models/order.model';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentUsersCount: number;
  conversionRate: number;
}

interface SalesDataPoint {
  date: string;
  orders: number;
  revenue: number;
}

interface TopProduct {
  productId: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
}

interface ActivityLog {
  type: 'order' | 'user' | 'product';
  action: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    paidOrders,
    pendingOrders,
    lowStockProducts,
    recentUsers
  ] = await Promise.all([
    UserModel.countDocuments(),
    ProductModel.countDocuments(),
    OrderModel.countDocuments(),
    OrderModel.find({ status: 'paid' }),
    OrderModel.countDocuments({ status: 'pending' }),
    ProductModel.countDocuments({ stock: { $lte: 10 }, isActive: true }),
    UserModel.countDocuments({ createdAt: { $gte: last30Days } })
  ]);

  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const conversionRate = totalUsers > 0 ? (paidOrders.length / totalUsers) * 100 : 0;

  return {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    pendingOrders,
    lowStockProducts,
    recentUsersCount: recentUsers,
    conversionRate: Math.round(conversionRate * 100) / 100
  };
};

export const getSalesAnalytics = async (period: string): Promise<SalesDataPoint[]> => {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orders = await OrderModel.find({
    createdAt: { $gte: startDate },
    status: { $in: ['paid', 'shipped'] }
  }).sort({ createdAt: 1 });

  const dataMap = new Map<string, { orders: number; revenue: number }>();

  orders.forEach(order => {
    const dateKey = order.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
    const existing = dataMap.get(dateKey) || { orders: 0, revenue: 0 };
    dataMap.set(dateKey, {
      orders: existing.orders + 1,
      revenue: existing.revenue + order.totalAmount
    });
  });

  const result: SalesDataPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    const data = dataMap.get(dateKey) || { orders: 0, revenue: 0 };
    result.push({
      date: dateKey,
      orders: data.orders,
      revenue: Math.round(data.revenue * 100) / 100
    });
  }

  return result;
};

export const getRevenueAnalytics = async (period: string) => {
  const salesData = await getSalesAnalytics(period);
  
  const totalRevenue = salesData.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = salesData.reduce((sum, point) => sum + point.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    chartData: salesData
  };
};

export const getTopProducts = async (limit: number): Promise<TopProduct[]> => {
  const orders = await OrderModel.find({ status: { $in: ['paid', 'shipped'] } });

  const productStats = new Map<string, { name: string; sold: number; revenue: number }>();

  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = productStats.get(item.productId) || { name: item.name, sold: 0, revenue: 0 };
      productStats.set(item.productId, {
        name: item.name,
        sold: existing.sold + item.quantity,
        revenue: existing.revenue + (item.price * item.quantity)
      });
    });
  });

  const topProducts: TopProduct[] = Array.from(productStats.entries())
    .map(([productId, stats]) => ({
      productId,
      name: stats.name,
      totalSold: stats.sold,
      totalRevenue: Math.round(stats.revenue * 100) / 100
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);

  return topProducts;
};

export const getRecentActivity = async (limit: number): Promise<ActivityLog[]> => {
  const [recentOrders, recentUsers, recentProducts] = await Promise.all([
    OrderModel.find().sort({ createdAt: -1 }).limit(limit).populate('user', 'email'),
    UserModel.find().sort({ createdAt: -1 }).limit(limit),
    ProductModel.find().sort({ updatedAt: -1 }).limit(limit)
  ]);

  const activities: ActivityLog[] = [];

  recentOrders.slice(0, 5).forEach(order => {
    activities.push({
      type: 'order',
      action: 'created',
      description: `New order #${order._id} - ${order.status}`,
      timestamp: order.createdAt || new Date(),
      metadata: { orderId: order._id.toString(), status: order.status }
    });
  });

  recentUsers.slice(0, 5).forEach(user => {
    activities.push({
      type: 'user',
      action: 'registered',
      description: `New user registered: ${user.email}`,
      timestamp: user.createdAt || new Date(),
      metadata: { userId: user._id.toString(), email: user.email }
    });
  });

  recentProducts.slice(0, 5).forEach(product => {
    activities.push({
      type: 'product',
      action: 'updated',
      description: `Product updated: ${product.name}`,
      timestamp: new Date(), // Product doesn't have updatedAt
      metadata: { productId: product._id.toString(), name: product.name }
    });
  });

  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
};
