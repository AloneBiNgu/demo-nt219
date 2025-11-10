import { NextFunction, Request, Response } from 'express';
import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import multer from 'multer';
import logger from '../utils/logger';
import { sendError } from '../utils/apiResponse';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): Response => {
  if (err instanceof multer.MulterError) {
    logger.warn({ err }, 'File upload failed');
    return sendError(res, StatusCodes.BAD_REQUEST, err.message);
  }

  if (err.message === 'Unsupported image type') {
    logger.warn({ err }, 'Rejected unsupported file upload');
    return sendError(res, StatusCodes.BAD_REQUEST, 'Unsupported image type');
  }

  logger.error({ err }, 'Unhandled error');
  return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, ReasonPhrases.INTERNAL_SERVER_ERROR);
};

export const notFoundHandler = (_req: Request, res: Response): Response => {
  return sendError(res, StatusCodes.NOT_FOUND, 'Resource not found');
};
