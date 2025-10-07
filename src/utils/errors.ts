// src/utils/errors.ts

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const NotFoundError = (msg = 'Resource not found') => new AppError(msg, 404);
export const ValidationError = (msg = 'Validation failed', details?: unknown) =>
  new AppError(msg, 400, details);
export const InternalError = (msg = 'Internal Server Error', details?: unknown) =>
  new AppError(msg, 500, details);
