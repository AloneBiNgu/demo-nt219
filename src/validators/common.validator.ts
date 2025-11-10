import Joi from 'joi';

export const objectIdSchema = Joi.string().hex().length(24).required();

export const productIdParamSchema = Joi.object({
  productId: objectIdSchema
});

export const orderIdParamSchema = Joi.object({
  orderId: objectIdSchema
});
