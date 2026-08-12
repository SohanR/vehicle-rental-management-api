import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { body } from 'express-validator';
import { db } from '../config/database';
import { AuthController } from '../controllers/auth.controller';
import { AppError } from '../errors';
import { validateRequest } from '../middlewares/validation.middleware';
import { StaffRepository } from '../repositories/staff.repository';
import { AuthService } from '../services/auth.service';

const staffRepository = new StaffRepository(db);
const authService = new AuthService(staffRepository);
const authController = new AuthController(authService);

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(429, 'Too many login attempts. Please try again later.', 'RATE_LIMIT_EXCEEDED'),
    );
  },
});

const loginValidation = [
  body('email').isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

export const authRouter = Router();

authRouter.post('/login', loginRateLimit, loginValidation, validateRequest, authController.login);
