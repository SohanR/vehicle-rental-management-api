export default async function globalTeardown(): Promise<void> {
  await import('./test-env');
  const { db } = await import('../../src/config/database');
  await db.destroy();
}
