import { AppError } from './app-error';

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action', details?: unknown) {
    super(403, message, 'FORBIDDEN', true, details);
    this.name = 'ForbiddenError';
  }
}
