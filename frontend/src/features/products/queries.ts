import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProduct,
  deleteProduct,
  fetchProductById,
  fetchProducts,
  updateProduct,
  uploadPrototypeImage,
  type ProductPayload
} from './api';
import type { ProductDto } from '../../types/api';

export const productKeys = {
  all: ['products'] as const,
  detail: (productId: string) => [...productKeys.all, productId] as const
};

export const useProductsQuery = () =>
  useQuery({
    queryKey: productKeys.all,
    queryFn: fetchProducts
  });

export const useProductQuery = (productId: string, enabled = true) =>
  useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => fetchProductById(productId),
    enabled
  });

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductPayload) => createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    }
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: Partial<ProductPayload> }) =>
      updateProduct(productId, payload),
    onSuccess: (_product: ProductDto, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
    }
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    }
  });
};

export const useUploadPrototypeImageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      file,
      onUploadProgress
    }: {
      productId: string;
      file: File;
      onUploadProgress?: (progress: number) => void;
    }) => uploadPrototypeImage(productId, file, onUploadProgress),
    onSuccess: (_product: ProductDto, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
    }
  });
};
