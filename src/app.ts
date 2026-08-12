import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFound } from './middlewares/not-found';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { apiRouter } from './routes';
import { httpLogger } from './utils/logger';

export const app = express();

app.disable('x-powered-by');
app.use(requestIdMiddleware);
app.use(httpLogger);
app.use(
  '/api-docs',
  helmet({ contentSecurityPolicy: false }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { customSiteTitle: 'Vehicle Rental API Docs' }),
);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
app.use('/api/v1', apiRouter);
app.use(notFound);
app.use(errorMiddleware);
