import { unlink } from 'node:fs/promises';
import type { RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../errors';

export const validateRequest: RequestHandler = async (req, _res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    if (req.file) {
      try {
        await unlink(req.file.path);
      } catch (error: unknown) {
        req.log.warn({ err: error, path: req.file.path }, 'Invalid upload could not be removed');
      }
    }
    next(
      new ValidationError(
        'Request validation failed',
        result.array({ onlyFirstError: true }).map((error) => ({
          field: error.type === 'field' ? error.path : undefined,
          message: error.msg as string,
        })),
      ),
    );
    return;
  }

  next();
};
