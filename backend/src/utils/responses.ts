import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Success response helper
 */
export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

/**
 * Error response helper
 */
export const errorResponse = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
): Response<ApiResponse> => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};

/**
 * Validation error response
 */
export const validationError = (
  res: Response,
  details: any
): Response<ApiResponse> => {
  return errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, details);
};

