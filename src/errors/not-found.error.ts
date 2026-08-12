import { AppError } from './app-error';

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(404, message, 'NOT_FOUND', true, details);
    this.name = 'NotFoundError';
  }
}
