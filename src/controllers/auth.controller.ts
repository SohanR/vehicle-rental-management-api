import type { RequestHandler } from 'express';
import type { AuthService } from '../services/auth.service';
import type { LoginBody, LoginResponse } from '../types/http';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login: RequestHandler<Record<string, never>, LoginResponse, LoginBody> = async (req, res) => {
    const result = await this.authService.login(req.body.email, req.body.password);
    res.status(200).json({ success: true, data: result });
  };
}
