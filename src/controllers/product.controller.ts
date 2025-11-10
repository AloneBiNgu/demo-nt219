import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import path from 'path';
import { promises as fs } from 'fs';
import { createProduct, listProducts, getProductById, updateProduct, deleteProduct } from '../services/product.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';
import type { IProduct, ProductDocument } from '../models/product.model';

const PROTOTYPE_PREFIX = '/uploads/prototypes/';

const buildPrototypeImageUrl = (req: Request, relativePath?: string | null) => {
  if (!relativePath) {
    return undefined;
  }

  if (/^https?:\/\//i.test(relativePath)) {
    return relativePath;
  }

  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const host = req.get('host');
  if (!host) {
    return normalizedPath;
  }

  const protocol = req.protocol;
  return `${protocol}://${host}${normalizedPath}`;
};

type ProductLike = ProductDocument | (IProduct & Record<string, unknown>);

const toPlainProduct = (product: ProductLike): IProduct & Record<string, unknown> => {
  if ('toObject' in product && typeof product.toObject === 'function') {
    return product.toObject();
  }
  return product as IProduct & Record<string, unknown>;
};

const formatProductResponse = (req: Request, product: ProductLike) => {
  const plainProduct = toPlainProduct(product);
  const prototypeImageUrl = buildPrototypeImageUrl(req, plainProduct.prototypeImageUrl as string | undefined);
  return {
    ...plainProduct,
    ...(prototypeImageUrl ? { prototypeImageUrl } : {})
  };
};

const removePrototypeImageIfExists = async (relativePath?: string) => {
  if (!relativePath || !relativePath.startsWith(PROTOTYPE_PREFIX)) {
    return;
  }

  const filePath = path.resolve(process.cwd(), relativePath.replace(/^\//, ''));
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      logger.warn({ err, filePath }, 'Failed to remove prototype image');
    }
  }
};

export const createProductHandler = async (req: Request, res: Response) => {
  try {
    const adminId = req.authUser?.id;
    const metadata = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    };
    const product = await createProduct(req.body, adminId, metadata);
    return sendSuccess(res, StatusCodes.CREATED, { product: formatProductResponse(req, product) });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create product');
    return sendError(res, StatusCodes.BAD_REQUEST, (error as Error).message);
  }
};

export const listProductsHandler = async (req: Request, res: Response) => {
  const products = await listProducts({ isActive: true });
  const formatted = products.map(product => formatProductResponse(req, product as ProductLike));
  return sendSuccess(res, StatusCodes.OK, { products: formatted });
};

export const getProductHandler = async (req: Request, res: Response) => {
  const product = await getProductById(req.params.productId);
  if (!product) {
    return sendError(res, StatusCodes.NOT_FOUND, 'Product not found');
  }
  return sendSuccess(res, StatusCodes.OK, { product: formatProductResponse(req, product) });
};

export const updateProductHandler = async (req: Request, res: Response) => {
  const adminId = req.authUser?.id;
  const metadata = {
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent')
  };
  const product = await updateProduct(req.params.productId, req.body, adminId, metadata);
  if (!product) {
    return sendError(res, StatusCodes.NOT_FOUND, 'Product not found');
  }
  return sendSuccess(res, StatusCodes.OK, { product: formatProductResponse(req, product) });
};

export const deleteProductHandler = async (req: Request, res: Response) => {
  const adminId = req.authUser?.id;
  const metadata = {
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent')
  };
  const product = await getProductById(req.params.productId);
  await deleteProduct(req.params.productId, adminId, metadata);
  if (product?.prototypeImageUrl) {
    await removePrototypeImageIfExists(product.prototypeImageUrl);
  }
  return res.status(StatusCodes.NO_CONTENT).send();
};

export const uploadPrototypeImageHandler = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Prototype image file is required');
  }

  const productId = req.params.productId;
  const product = await getProductById(productId);

  if (!product) {
    await fs.unlink(file.path).catch(() => undefined);
    return sendError(res, StatusCodes.NOT_FOUND, 'Product not found');
  }

  const relativePath = `${PROTOTYPE_PREFIX}${file.filename}`;
  const previousImage = product.prototypeImageUrl;

  product.prototypeImageUrl = relativePath;
  await product.save();

  if (previousImage && previousImage !== relativePath) {
    await removePrototypeImageIfExists(previousImage);
  }

  return sendSuccess(res, StatusCodes.OK, { product: formatProductResponse(req, product) });
};
