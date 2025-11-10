import { Schema, model, HydratedDocument } from 'mongoose';

export interface IProductPriceSnapshot {
  productId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

export interface IProduct {
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  prototypeImageUrl?: string;
}

export type ProductDocument = HydratedDocument<IProduct>;

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: 'usd'
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    prototypeImageUrl: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

productSchema.index({ name: 1 }, { unique: true });

export const ProductModel = model<IProduct>('Product', productSchema);
