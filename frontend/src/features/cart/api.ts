import { apiClient } from '../../api/client';
import type { ApiSuccess } from '../../types/api';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  imageUrl?: string;
}

export interface CartResponse {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  updatedAt?: string;
}

export const getCart = async (): Promise<CartResponse> => {
  const response = await apiClient.get<ApiSuccess<{ cart: CartResponse }>>('/cart');
  return response.data.data.cart;
};

export const addToCart = async (productId: string, quantity: number): Promise<CartResponse> => {
  const response = await apiClient.post<ApiSuccess<{ cart: CartResponse }>>('/cart/add', {
    productId,
    quantity
  });
  return response.data.data.cart;
};

export const updateCartItem = async (productId: string, quantity: number): Promise<CartResponse> => {
  const response = await apiClient.put<ApiSuccess<{ cart: CartResponse }>>('/cart/update', {
    productId,
    quantity
  });
  return response.data.data.cart;
};

export const removeFromCart = async (productId: string): Promise<CartResponse> => {
  const response = await apiClient.delete<ApiSuccess<{ cart: CartResponse }>>('/cart/remove', {
    data: { productId }
  });
  return response.data.data.cart;
};

export const clearCart = async (): Promise<CartResponse> => {
  const response = await apiClient.delete<ApiSuccess<{ cart: CartResponse }>>('/cart/clear');
  return response.data.data.cart;
};
