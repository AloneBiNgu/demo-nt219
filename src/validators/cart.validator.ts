import Joi from 'joi';

// MongoDB ObjectId regex pattern (24 hex characters)
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const addToCartSchema = Joi.object({
  productId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.empty': 'Product ID is required',
      'string.pattern.base': 'Product ID must be a valid ObjectId',
      'any.required': 'Product ID is required'
    }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required'
  })
});

export const updateCartItemSchema = Joi.object({
  productId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.empty': 'Product ID is required',
      'string.pattern.base': 'Product ID must be a valid ObjectId',
      'any.required': 'Product ID is required'
    }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required'
  })
});

export const removeFromCartSchema = Joi.object({
  productId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.empty': 'Product ID is required',
      'string.pattern.base': 'Product ID must be a valid ObjectId',
      'any.required': 'Product ID is required'
    })
});
