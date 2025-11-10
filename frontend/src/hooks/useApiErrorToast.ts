import { useToast } from '@chakra-ui/react';
import { AxiosError } from 'axios';
import { useCallback } from 'react';
import type { ApiError } from '../types/api';

export const useApiErrorToast = () => {
  const toast = useToast();

  return useCallback(
    (error: unknown, fallbackMessage = 'Something went wrong') => {
      let message = fallbackMessage;

      if (error && typeof error === 'object') {
        if ('message' in error && typeof (error as Error).message === 'string') {
          message = (error as Error).message;
        }

        if ('response' in error) {
          const axiosError = error as AxiosError<ApiError>;
          const apiMessage = axiosError.response?.data?.message;
          if (apiMessage) {
            message = apiMessage;
          }
        }
      }

      toast({ title: message, status: 'error', duration: 5000, position: 'top' });
    },
    [toast]
  );
};
