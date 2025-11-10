import { FilterQuery } from 'mongoose';
import { ProductModel, ProductDocument, IProduct } from '../models/product.model';
import xss from 'xss';
import { createAuditLog } from './audit.service';

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  isActive?: boolean;
  prototypeImageUrl?: string;
}

/**
 * Sanitize product input to prevent XSS attacks
 */
const sanitizeProductInput = (input: Partial<CreateProductInput>): Partial<CreateProductInput> => {
  return {
    ...input,
    name: input.name ? xss(input.name, { 
      whiteList: {}, // No HTML allowed in name
      stripIgnoreTag: true,
      stripIgnoreTagBody: true
    }) : input.name,
    description: input.description ? xss(input.description, {
      whiteList: {}, // No HTML allowed in description
      stripIgnoreTag: true,
      stripIgnoreTagBody: true
    }) : input.description
  };
};

export const createProduct = async (
  input: CreateProductInput,
  adminId?: string,
  metadata?: { ip?: string; userAgent?: string }
): Promise<ProductDocument> => {
  const sanitizedInput = sanitizeProductInput(input) as CreateProductInput;
  const product = new ProductModel({
    ...sanitizedInput,
    isActive: sanitizedInput.isActive ?? true,
    prototypeImageUrl: sanitizedInput.prototypeImageUrl
  });
  const savedProduct = await product.save();

  if (adminId) {
    await createAuditLog({
      eventType: 'admin.product_created',
      userId: adminId,
      action: 'create_product',
      resource: `product:${savedProduct._id}`,
      metadata: {
        productId: savedProduct._id.toString(),
        productName: savedProduct.name,
        price: savedProduct.price,
        stock: savedProduct.stock,
        ip: metadata?.ip,
        userAgent: metadata?.userAgent
      },
      result: 'success',
      riskScore: 0
    });
  }

  return savedProduct;
};

export const listProducts = async (filter: FilterQuery<IProduct> = {}): Promise<IProduct[]> => {
  return ProductModel.find(filter).lean();
};

export const getProductById = async (productId: string): Promise<ProductDocument | null> => {
  return ProductModel.findById(productId);
};

export const updateProduct = async (
  productId: string,
  updates: Partial<CreateProductInput>,
  adminId?: string,
  metadata?: { ip?: string; userAgent?: string }
): Promise<ProductDocument | null> => {
  const oldProduct = await ProductModel.findById(productId).select('name price stock');
  const sanitizedUpdates = sanitizeProductInput(updates);
  const product = await ProductModel.findByIdAndUpdate(productId, sanitizedUpdates, { new: true, runValidators: true });

  if (product && adminId) {
    await createAuditLog({
      eventType: 'admin.product_updated',
      userId: adminId,
      action: 'update_product',
      resource: `product:${productId}`,
      metadata: {
        productId,
        productName: product.name,
        changes: sanitizedUpdates,
        oldData: {
          name: oldProduct?.name,
          price: oldProduct?.price,
          stock: oldProduct?.stock
        },
        ip: metadata?.ip,
        userAgent: metadata?.userAgent
      },
      result: 'success',
      riskScore: 0
    });
  }

  return product;
};

export const deleteProduct = async (
  productId: string,
  adminId?: string,
  metadata?: { ip?: string; userAgent?: string }
): Promise<void> => {
  const product = await ProductModel.findById(productId).select('name price');
  await ProductModel.findByIdAndDelete(productId);

  if (product && adminId) {
    await createAuditLog({
      eventType: 'admin.product_deleted',
      userId: adminId,
      action: 'delete_product',
      resource: `product:${productId}`,
      metadata: {
        productId,
        productName: product.name,
        price: product.price,
        ip: metadata?.ip,
        userAgent: metadata?.userAgent
      },
      result: 'success',
      riskScore: 5
    });
  }
};
