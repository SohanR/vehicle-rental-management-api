import { AppError } from './app-error';

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(500, message, 'INTERNAL_SERVER_ERROR', true, details);
    this.name = 'InternalServerError';
  }
}
