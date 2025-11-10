import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../services/cart.service';
import logger from '../utils/logger';

export const getCartHandler = async (req: Request, res: Response) => {
  try {
    if (!req.authUser) {
      return sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated');
    }

    const cart = await getCart(req.authUser.id);
    
    if (!cart) {
      return sendSuccess(res, StatusCodes.OK, {
        cart: {
          items: [],
          totalItems: 0,
          totalPrice: 0
        }
      });
    }

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return sendSuccess(res, StatusCodes.OK, {
      cart: {
        items: cart.items,
        totalItems,
        totalPrice,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get cart');
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get cart');
  }
};

export const addToCartHandler = async (req: Request, res: Response) => {
  try {
    if (!req.authUser) {
      return sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated');
    }

    const { productId, quantity } = req.body;
    
    // Debug log
    logger.info({ 
      productId, 
      productIdType: typeof productId,
      productIdValue: JSON.stringify(productId),
      quantity 
    }, 'Controller received add to cart request');

    const cart = await addToCart({
      userId: req.authUser.id,
      productId,
      quantity
    });

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return sendSuccess(res, StatusCodes.OK, {
      message: 'Item added to cart',
      cart: {
        items: cart.items,
        totalItems,
        totalPrice,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to add to cart');
    return sendError(res, StatusCodes.BAD_REQUEST, (error as Error).message);
  }
};

export const updateCartItemHandler = async (req: Request, res: Response) => {
  try {
    if (!req.authUser) {
      return sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated');
    }

    const { productId, quantity } = req.body;

    const cart = await updateCartItem({
      userId: req.authUser.id,
      productId,
      quantity
    });

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return sendSuccess(res, StatusCodes.OK, {
      message: 'Cart updated',
      cart: {
        items: cart.items,
        totalItems,
        totalPrice,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to update cart');
    return sendError(res, StatusCodes.BAD_REQUEST, (error as Error).message);
  }
};

export const removeFromCartHandler = async (req: Request, res: Response) => {
  try {
    if (!req.authUser) {
      return sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated');
    }

    const { productId } = req.body;

    const cart = await removeFromCart(req.authUser.id, productId);

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return sendSuccess(res, StatusCodes.OK, {
      message: 'Item removed from cart',
      cart: {
        items: cart.items,
        totalItems,
        totalPrice,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to remove from cart');
    return sendError(res, StatusCodes.BAD_REQUEST, (error as Error).message);
  }
};

export const clearCartHandler = async (req: Request, res: Response) => {
  try {
    if (!req.authUser) {
      return sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated');
    }

    const cart = await clearCart(req.authUser.id);

    return sendSuccess(res, StatusCodes.OK, {
      message: 'Cart cleared',
      cart: {
        items: cart.items,
        totalItems: 0,
        totalPrice: 0,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to clear cart');
    return sendError(res, StatusCodes.BAD_REQUEST, (error as Error).message);
  }
};
