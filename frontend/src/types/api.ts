export type ApiStatus = 'success' | 'error';

export interface ApiSuccess<T> {
  status: 'success';
  data: T;
  message?: string;
}

export interface ApiError {
  status: 'error';
  message: string;
  details?: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  tokenVersion?: number;
  isEmailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
  };
  message?: string;
}

export interface RegisterResponse {
  user: AuthUser;
  message: string;
}

export interface EmailVerificationRequiredResponse {
  requiresEmailVerification: true;
  email: string;
  message: string;
}

export interface TwoFactorRequiredResponse {
  requiresTwoFactor: true;
  tempToken: string;
  message: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  message: string;
}

export interface SessionInfo {
  _id: string;
  deviceName: string;
  deviceId?: string;
  userAgent: string;
  ipAddress: string;
  location?: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrentSession?: boolean;
}

export interface PasswordResetTokenValidation {
  message: string;
}

export interface ProductDto {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  prototypeImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDto {
  productId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

export interface OrderDto {
  _id: string;
  user: string | { _id: string; email: string; displayName?: string };
  items: OrderItemDto[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'shipped' | 'cancelled';
  paymentIntentId?: string;
  clientSecret?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
}

export interface OrderPaymentDetails {
  orderId: string;
  clientSecret: string;
  totalAmount: number;
  currency: string;
  items: OrderItemDto[];
  createdAt: string;
}
