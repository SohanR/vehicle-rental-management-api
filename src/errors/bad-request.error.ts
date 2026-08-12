import { AppError } from './app-error';

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, message, 'BAD_REQUEST', true, details);
    this.name = 'BadRequestError';
  }
}
