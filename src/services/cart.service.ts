import { CartModel, CartDocument } from '../models/cart.model';
import { ProductModel } from '../models/product.model';
import logger from '../utils/logger';
import mongoose from 'mongoose';

export interface AddToCartInput {
  userId: string;
  productId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  userId: string;
  productId: string;
  quantity: number;
}

export const getCart = async (userId: string): Promise<CartDocument | null> => {
  const cart = await CartModel.findOne({ userId });
  return cart;
};

export const addToCart = async (input: AddToCartInput): Promise<CartDocument> => {
  const { userId, productId, quantity } = input;

  // Log input for debugging
  logger.info({ userId, productId, quantity }, 'Adding to cart');

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    logger.error({ productId }, 'Invalid product ID format');
    throw new Error('Invalid product ID format');
  }

  // Validate product exists and is active
  const product = await ProductModel.findById(productId);
  logger.info({ product: product?._id, found: !!product }, 'Product lookup result');
  
  if (!product) {
    throw new Error('Product not found');
  }
  if (!product.isActive) {
    throw new Error('Product is not available');
  }
  if (product.stock < quantity) {
    throw new Error(`Only ${product.stock} items available in stock`);
  }

  let cart = await CartModel.findOne({ userId });

  if (!cart) {
    // Create new cart
    cart = new CartModel({
      userId,
      items: [
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          quantity,
          imageUrl: product.prototypeImageUrl
        }
      ]
    });
  } else {
    // Update existing cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.stock) {
        throw new Error(`Cannot add more. Only ${product.stock} items available`);
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price; // Update price in case it changed
    } else {
      // Add new item
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        quantity,
        imageUrl: product.prototypeImageUrl
      });
    }
  }

  await cart.save();
  logger.info({ userId, productId, quantity }, 'Item added to cart');
  return cart;
};

export const updateCartItem = async (input: UpdateCartItemInput): Promise<CartDocument> => {
  const { userId, productId, quantity } = input;

  const cart = await CartModel.findOne({ userId });
  if (!cart) {
    throw new Error('Cart not found');
  }

  // Validate product stock
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }
  if (quantity > product.stock) {
    throw new Error(`Only ${product.stock} items available in stock`);
  }

  const itemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId
  );

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  cart.items[itemIndex].quantity = quantity;
  cart.items[itemIndex].price = product.price; // Update price
  
  await cart.save();
  logger.info({ userId, productId, quantity }, 'Cart item updated');
  return cart;
};

export const removeFromCart = async (userId: string, productId: string): Promise<CartDocument> => {
  const cart = await CartModel.findOne({ userId });
  if (!cart) {
    throw new Error('Cart not found');
  }

  cart.items = cart.items.filter(
    item => item.productId.toString() !== productId
  );

  await cart.save();
  logger.info({ userId, productId }, 'Item removed from cart');
  return cart;
};

export const clearCart = async (userId: string): Promise<CartDocument> => {
  const cart = await CartModel.findOne({ userId });
  if (!cart) {
    throw new Error('Cart not found');
  }

  cart.items = [];
  await cart.save();
  logger.info({ userId }, 'Cart cleared');
  return cart;
};

export const clearCartIfExists = async (userId: string): Promise<void> => {
  await CartModel.updateOne({ userId }, { $set: { items: [] } });
  logger.info({ userId }, 'Cart cleared (idempotent)');
};
