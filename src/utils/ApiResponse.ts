import { Response } from 'express';

export function sendResponse<T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T
) {
  return res.status(statusCode).json({
    success,
    message,
    ...(data !== undefined ? { data } : {}),
  });
}
