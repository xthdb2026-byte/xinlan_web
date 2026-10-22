import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function notFound(req: Request, res: Response, next: NextFunction) {
  const error: AppError = new Error(`接口不存在: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? '服务器内部错误';

  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    statusCode,
  });

  res.status(statusCode).json({
    code: err.code ?? 'ERROR',
    message,
    details: err.details,
  });
}
