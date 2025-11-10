import Joi, { Schema } from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(3).required(),
  description: Joi.string().trim().min(10).required(),
  price: Joi.number().precision(2).positive().required(),
  currency: Joi.string().uppercase().length(3).default('USD'),
  stock: Joi.number().integer().min(0).required(),
  isActive: Joi.boolean().default(true),
  prototypeImageUrl: Joi.string()
    .trim()
    .max(2048)
    .pattern(/^\/?uploads\/prototypes\/[A-Za-z0-9._-]+$/)
    .optional()
});

export const updateProductSchema = createProductSchema.fork(
  ['name', 'description', 'price', 'currency', 'stock', 'isActive', 'prototypeImageUrl'],
  (schema: Schema) => schema.optional()
);
