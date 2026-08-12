export default async function globalSetup(): Promise<void> {
  await import('./test-env');
  const { db } = await import('../../src/config/database');

  try {
    await db.migrate.rollback(undefined, true);
    await db.migrate.latest();
    await db.seed.run();
  } finally {
    await db.destroy();
  }
}
