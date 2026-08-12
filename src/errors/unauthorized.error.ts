import { AppError } from './app-error';

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required', details?: unknown) {
    super(401, message, 'UNAUTHORIZED', true, details);
    this.name = 'UnauthorizedError';
  }
}
