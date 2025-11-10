import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import type { ApiSuccess } from '../../types/api';

export interface UserDto {
  _id: string;
  email: string;
  role: 'user' | 'admin';
  provider: 'local' | 'google';
  isEmailVerified: boolean;
  displayName?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface UsersPagination {
  users: UserDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UserActivity {
  userId: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  registeredAt: string;
  orders: any[];
}

export const useUsersQuery = (filters: { page?: number; limit?: number; role?: string; search?: string } = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.page) queryParams.set('page', filters.page.toString());
  if (filters.limit) queryParams.set('limit', filters.limit.toString());
  if (filters.role) queryParams.set('role', filters.role);
  if (filters.search) queryParams.set('search', filters.search);

  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccess<UsersPagination>>(`/users?${queryParams.toString()}`);
      return response.data.data;
    }
  });
};

export const useUserQuery = (userId: string) => {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccess<UserDto>>(`/users/${userId}`);
      return response.data.data;
    },
    enabled: !!userId
  });
};

export const useUserActivityQuery = (userId: string) => {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'activity'],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccess<UserActivity>>(`/users/${userId}/activity`);
      return response.data.data;
    },
    enabled: !!userId
  });
};

export const useUpdateUserRoleMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'user' | 'admin' }) => {
      const response = await apiClient.patch<ApiSuccess<UserDto>>(`/users/${userId}/role`, { role });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });
};
