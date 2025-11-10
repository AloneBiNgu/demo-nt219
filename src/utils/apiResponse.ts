import { Response } from 'express';

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

export const sendSuccess = <T>(res: Response, statusCode: number, data: T, message?: string): Response<ApiSuccess<T>> => {
  return res.status(statusCode).json({ status: 'success', data, message });
};

export const sendError = (res: Response, statusCode: number, message: string, details?: unknown): Response<ApiError> => {
  return res.status(statusCode).json({ status: 'error', message, details });
};
