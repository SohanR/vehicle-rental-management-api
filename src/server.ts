import type { Server } from 'node:http';
import { app } from './app';
import { db } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';

let server: Server | undefined;
let shuttingDown = false;

async function start(): Promise<void> {
  await db.raw('select 1');
  server = app.listen(env.PORT, () => {
    const serverUrl = `http://localhost:${env.PORT}`;
    logger.info(
      { port: env.PORT, serverUrl, swaggerUrl: `${serverUrl}/api-docs` },
      'API server started',
    );
    process.stdout.write(
      ` Server running on ${serverUrl}\n Swagger Docs available at ${serverUrl}/api-docs\n`,
    );
  });
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Graceful shutdown started');

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await db.destroy();
  logger.info('Graceful shutdown completed');
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void shutdown(signal)
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        logger.fatal({ err: error }, 'Graceful shutdown failed');
        process.exit(1);
      });
  });
}

start().catch((error: unknown) => {
  logger.fatal({ err: error }, 'API server failed to start');
  void db.destroy().finally(() => process.exit(1));
});
