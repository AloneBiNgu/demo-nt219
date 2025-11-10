import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import type { ApiSuccess } from '../../types/api';

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
  timestamp: string;
  metadata?: Record<string, any>;
}

export const useDashboardStatsQuery = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccess<DashboardStats>>('/analytics/dashboard-stats');
      return response.data.data;
    }
  });
};

export const useSalesAnalyticsQuery = (period: string = '30d') => {
  return useQuery({
    queryKey: ['admin', 'sales-analytics', period],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccess<SalesDataPoint[]>>(`/analytics/sales?period=${period}`);
      return response.data.data;
    }
  });
};

export const useTopProductsQuery = (limit: number = 10) => {
  return useQuery({
    queryKey: ['admin', 'top-products', limit],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccess<TopProduct[]>>(`/analytics/top-products?limit=${limit}`);
      return response.data.data;
    }
  });
};

export const useRecentActivityQuery = (limit: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'recent-activity', limit],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccess<ActivityLog[]>>(`/analytics/recent-activity?limit=${limit}`);
      return response.data.data;
    }
  });
};
