import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string(),
    DB_POOL_MIN: z.coerce.number().int().min(0).default(2),
    DB_POOL_MAX: z.coerce.number().int().min(1).default(10),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
    UPLOAD_DIR: z.string().min(1).default('uploads'),
  })
  .refine((value) => value.DB_POOL_MAX >= value.DB_POOL_MIN, {
    path: ['DB_POOL_MAX'],
    message: 'DB_POOL_MAX must be greater than or equal to DB_POOL_MIN',
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = Object.freeze(result.data);
export type Environment = z.infer<typeof envSchema>;
