import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/integration/**/*.spec.ts'],
  setupFiles: ['<rootDir>/tests/setup/test-env.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/after-env.ts'],
  globalSetup: '<rootDir>/tests/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 30_000,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
};

export default config;
