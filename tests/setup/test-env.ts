process.env.NODE_ENV = 'test';
process.env.PORT ??= '3001';
process.env.DB_HOST = process.env.TEST_DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT ?? '5432';
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'vehicle_rental_test';
process.env.DB_USER = process.env.TEST_DB_USER ?? 'postgres';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? 'postgres';
process.env.JWT_SECRET ??= 'test-jwt-secret-that-is-at-least-32-characters';
process.env.UPLOAD_DIR ??= 'uploads/test';

if (!process.env.DB_NAME.endsWith('_test')) {
  throw new Error(
    `Refusing to run integration tests against non-test database: ${process.env.DB_NAME}`,
  );
}

export {};
