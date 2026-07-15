import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  // Known application errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorDetails: err.errorDetails ?? null,
    });
  }

  // Prisma known request errors (unique constraint, record not found, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const statusMap: Record<string, number> = {
      P2002: 409, // unique constraint violation
      P2025: 404, // record not found
    };
    return res.status(statusMap[err.code] ?? 400).json({
      success: false,
      message: 'Database request error',
      errorDetails: { code: err.code, meta: err.meta },
    });
  }

  // Prisma validation errors (bad shape passed to a query)
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data passed to database query',
      errorDetails: null,
    });
  }

  // Fallback — unknown error
  // eslint-disable-next-line no-console
  console.error(err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errorDetails: process.env.NODE_ENV === 'development' ? message : null,
  });
}
