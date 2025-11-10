import { Schema, model, HydratedDocument, Types } from 'mongoose';

export interface ICartItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  imageUrl?: string;
}

export interface ICart {
  userId: Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}

export type CartDocument = HydratedDocument<ICart>;

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    imageUrl: {
      type: String
    }
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: {
      type: [cartItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const CartModel = model<ICart>('Cart', cartSchema);
