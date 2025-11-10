import { useQuery } from '@tanstack/react-query';
import { fetchAllOrders, fetchMyOrders } from './api';

export const orderKeys = {
  all: ['orders'] as const,
  mine: () => [...orderKeys.all, 'me'] as const
};

export const useMyOrdersQuery = () =>
  useQuery({
    queryKey: orderKeys.mine(),
    queryFn: fetchMyOrders
  });

export const useAdminOrdersQuery = () =>
  useQuery({
    queryKey: orderKeys.all,
    queryFn: fetchAllOrders
  });
