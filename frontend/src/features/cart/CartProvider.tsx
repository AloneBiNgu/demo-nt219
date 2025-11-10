import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  useCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation
} from './queries';
import type { CartItem } from './api';

interface CartContextValue {
  items: CartItem[];
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  error: Error | null;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { data: cartData, isLoading, error, refetch } = useCartQuery();
  const addToCartMutation = useAddToCartMutation();
  const updateCartMutation = useUpdateCartItemMutation();
  const removeCartMutation = useRemoveFromCartMutation();
  const clearCartMutation = useClearCartMutation();
  
  // Track previous user to detect login changes
  const prevUserIdRef = useRef<string | null>(null);

  // Refetch cart only when user logs in (not on every render or logout)
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;
    
    // Only refetch if user just logged in (was null, now has value)
    if (currentUserId && currentUserId !== prevUserId) {
      refetch();
    }
    
    prevUserIdRef.current = currentUserId;
  }, [user?.id, refetch]);

  const items = cartData?.items ?? [];
  const totalItems = cartData?.totalItems ?? 0;
  const totalPrice = cartData?.totalPrice ?? 0;

  const addItem = async (productId: string, quantity: number) => {
    if (!user) {
      throw new Error('Must be logged in to add items to cart');
    }
    
    await addToCartMutation.mutateAsync({
      productId,
      quantity
    });
  };

  const removeItem = async (productId: string) => {
    if (!user) {
      throw new Error('Must be logged in to remove items from cart');
    }
    
    await removeCartMutation.mutateAsync(productId);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) {
      throw new Error('Must be logged in to update cart');
    }
    
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }
    
    await updateCartMutation.mutateAsync({ productId, quantity });
  };

  const clearCartHandler = async () => {
    if (!user) {
      throw new Error('Must be logged in to clear cart');
    }
    
    await clearCartMutation.mutateAsync();
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart: clearCartHandler,
        totalItems,
        totalPrice,
        isLoading,
        error: error as Error | null
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
