import { apiClient } from '../../api/client';
import type { ApiSuccess, OrderDto } from '../../types/api';

export const fetchMyOrders = async (): Promise<OrderDto[]> => {
  const response = await apiClient.get<ApiSuccess<{ orders: OrderDto[] }>>('/orders/me');
  return response.data.data.orders;
};

export const fetchAllOrders = async (): Promise<OrderDto[]> => {
  const response = await apiClient.get<ApiSuccess<{ 
    orders: OrderDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>>('/orders');
  return response.data.data.orders;
};

/**
 * DEV ONLY: Complete payment for testing without Stripe webhook
 */
export const completePaymentDev = async (orderId: string): Promise<OrderDto> => {
  const response = await apiClient.post<ApiSuccess<{ order: OrderDto }>>(`/orders/${orderId}/complete-payment-dev`);
  return response.data.data.order;
};

/**
 * Get payment details to resume payment for a processing order
 */
export const getOrderPaymentDetails = async (orderId: string) => {
  const response = await apiClient.get<ApiSuccess<{
    orderId: string;
    clientSecret: string;
    totalAmount: number;
    currency: string;
    items: Array<{ productId: string; name: string; price: number; currency: string; quantity: number }>;
    createdAt: string;
  }>>(`/orders/${orderId}/payment-details`);
  return response.data.data;
};
