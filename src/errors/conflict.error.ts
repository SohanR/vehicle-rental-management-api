import { AppError } from './app-error';

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(409, message, 'CONFLICT', true, details);
    this.name = 'ConflictError';
  }
}
