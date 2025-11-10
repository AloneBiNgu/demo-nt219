import { apiClient } from '../../api/client';
import type { ApiSuccess, PaymentIntentResponse } from '../../types/api';

export interface PaymentItemInput {
  productId: string;
  quantity: number;
}

export const createPaymentIntent = async (items: PaymentItemInput[]): Promise<PaymentIntentResponse> => {
  const response = await apiClient.post<ApiSuccess<PaymentIntentResponse>>('/payments/create-intent', {
    items
  });
  return response.data.data;
};
