import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../errors';

interface StaffJwtPayload extends JwtPayload {
  id: number;
  email: string;
  name: string;
}

function isStaffPayload(payload: string | JwtPayload): payload is StaffJwtPayload {
  return (
    typeof payload !== 'string' &&
    typeof payload.id === 'number' &&
    typeof payload.email === 'string' &&
    typeof payload.name === 'string'
  );
}

export const authenticateJWT: RequestHandler = (req, _res, next) => {
  const authorization = req.header('authorization');
  const [scheme, token] = authorization?.split(' ') ?? [];

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    next(new UnauthorizedError('A valid Bearer token is required'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });

    if (!isStaffPayload(payload)) {
      throw new UnauthorizedError('Token payload is invalid');
    }

    req.user = { id: payload.id, email: payload.email, name: payload.name };
    next();
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    next(new UnauthorizedError('Token is invalid or expired'));
  }
};
