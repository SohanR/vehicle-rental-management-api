import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: { service: 'vehicle-rental-api', environment: env.NODE_ENV },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'password_hash'],
    censor: '[REDACTED]',
  },
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] as string,
  customProps(req) {
    return { requestId: req.id };
  },
  customLogLevel(_req, res, error) {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
