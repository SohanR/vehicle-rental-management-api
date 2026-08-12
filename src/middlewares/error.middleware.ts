import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { env } from '../config/env';
import { AppError, BadRequestError } from '../errors';

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export const errorMiddleware: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  const normalizedError =
    error instanceof multer.MulterError
      ? new BadRequestError(
          error.code === 'LIMIT_FILE_SIZE'
            ? 'Vehicle photo must not exceed 5 MB'
            : `File upload failed: ${error.message}`,
        )
      : error;
  const knownError = normalizedError instanceof AppError ? normalizedError : undefined;
  const statusCode = knownError?.statusCode ?? 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    req.log.error(
      {
        err: normalizedError,
        requestId: req.id,
        isOperational: knownError?.isOperational ?? false,
      },
      'Request failed with a server error',
    );
  } else {
    req.log.warn(
      { err: normalizedError, requestId: req.id, statusCode },
      'Request failed with an operational error',
    );
  }

  const hideInternalDetails = env.NODE_ENV === 'production' && isServerError;
  const response: ErrorResponse = {
    success: false,
    error: {
      message: hideInternalDetails
        ? 'Internal server error'
        : (knownError?.message ?? 'Internal server error'),
      code: hideInternalDetails
        ? 'INTERNAL_SERVER_ERROR'
        : (knownError?.code ?? 'INTERNAL_SERVER_ERROR'),
    },
  };

  if (knownError?.details !== undefined && !hideInternalDetails) {
    response.error.details = knownError.details;
  }

  res.status(statusCode).json(response);
};
