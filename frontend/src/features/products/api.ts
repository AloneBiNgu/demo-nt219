import { apiClient } from '../../api/client';
import type { ApiSuccess, ProductDto } from '../../types/api';

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  prototypeImageUrl?: string;
}

export const fetchProducts = async (): Promise<ProductDto[]> => {
  const response = await apiClient.get<ApiSuccess<{ products: ProductDto[] }>>('/products');
  return response.data.data.products;
};

export const fetchProductById = async (productId: string): Promise<ProductDto> => {
  const response = await apiClient.get<ApiSuccess<{ product: ProductDto }>>(`/products/${productId}`);
  return response.data.data.product;
};

export const createProduct = async (payload: ProductPayload): Promise<ProductDto> => {
  const response = await apiClient.post<ApiSuccess<{ product: ProductDto }>>('/products', payload);
  return response.data.data.product;
};

export const updateProduct = async (productId: string, payload: Partial<ProductPayload>): Promise<ProductDto> => {
  const response = await apiClient.put<ApiSuccess<{ product: ProductDto }>>(`/products/${productId}`, payload);
  return response.data.data.product;
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await apiClient.delete(`/products/${productId}`);
};

export const uploadPrototypeImage = async (
  productId: string,
  file: File,
  onUploadProgress?: (progress: number) => void
): Promise<ProductDto> => {
  const formData = new FormData();
  formData.append('prototypeImage', file);

  const response = await apiClient.post<ApiSuccess<{ product: ProductDto }>>(
    `/products/${productId}/prototype-image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: event => {
        if (event.total) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onUploadProgress?.(progress);
        }
      }
    }
  );

  return response.data.data.product;
};
