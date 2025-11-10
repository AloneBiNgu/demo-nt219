import { Schema, model, HydratedDocument, Types } from 'mongoose';
import { IProductPriceSnapshot } from './product.model';

export type OrderStatus = 'pending' | 'processing' | 'paid' | 'shipped' | 'cancelled';

export interface IOrderItem extends IProductPriceSnapshot {}

export interface IOrder {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentIntentId?: string;
  clientSecret?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderDocument = HydratedDocument<IOrder>;

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true,
      uppercase: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: {
      type: [orderItemSchema],
      validate: [Array.isArray, 'items must be an array'],
      default: []
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      uppercase: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'shipped', 'cancelled'],
      default: 'pending'
    },
    paymentIntentId: {
      type: String
    },
    clientSecret: {
      type: String,
      select: false // Don't return by default for security
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ paymentIntentId: 1 }, { unique: true, sparse: true });

export const OrderModel = model<IOrder>('Order', orderSchema);
