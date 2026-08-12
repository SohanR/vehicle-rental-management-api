import { AppError } from './app-error';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(422, message, 'VALIDATION_ERROR', true, details);
    this.name = 'ValidationError';
  }
}
