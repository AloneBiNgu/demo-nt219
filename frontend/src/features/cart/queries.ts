import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from './api';

const CART_QUERY_KEY = ['cart'];

export const useCartQuery = () => {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: getCart,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1
  });
};

export const useAddToCartMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      addToCart(productId, quantity),
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
    }
  });
};

export const useUpdateCartItemMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateCartItem(productId, quantity),
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
    }
  });
};

export const useRemoveFromCartMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId: string) => removeFromCart(productId),
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
    }
  });
};

export const useClearCartMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clearCart,
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
    }
  });
};
