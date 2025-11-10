import { NextFunction, Request, Response } from 'express';
import { ObjectSchema, ValidationErrorItem } from 'joi';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/apiResponse';

export const validateRequest = (schema: ObjectSchema, property: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const data = req[property];
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });

    if (error) {
      return sendError(
        res,
        StatusCodes.BAD_REQUEST,
        'Validation failed',
        error.details.map((detail: ValidationErrorItem) => detail.message)
      );
    }

    switch (property) {
      case 'body':
        req.body = value;
        break;
      case 'query':
        req.query = value;
        break;
      case 'params':
        req.params = value;
        break;
      default:
        break;
    }
    return next();
  };
