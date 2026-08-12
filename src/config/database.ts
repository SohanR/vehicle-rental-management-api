import knex, { type Knex } from 'knex';
import { types as pgTypes } from 'pg';
import { env } from './env';

const runningCompiledCode = __filename.endsWith('.js');

// PostgreSQL DATE values are calendar dates, not instants in time. Returning them as
// strings prevents the pg driver from applying the server's timezone during JSON output.
pgTypes.setTypeParser(1082, (value: string) => value);

export const databaseConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  },
  pool: {
    min: env.DB_POOL_MIN,
    max: env.DB_POOL_MAX,
    acquireTimeoutMillis: 30_000,
    idleTimeoutMillis: 30_000,
    createTimeoutMillis: 30_000,
  },
  migrations: {
    directory: runningCompiledCode ? './dist/database/migrations' : './database/migrations',
    extension: runningCompiledCode ? 'js' : 'ts',
    loadExtensions: runningCompiledCode ? ['.js'] : ['.ts'],
  },
  seeds: {
    directory: runningCompiledCode ? './dist/database/seeds' : './database/seeds',
    extension: runningCompiledCode ? 'js' : 'ts',
    loadExtensions: runningCompiledCode ? ['.js'] : ['.ts'],
  },
};

export const db = knex(databaseConfig);
