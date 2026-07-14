/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  setupFiles: ['<rootDir>/test/jest.setup.ts'],
  testTimeout: 20000,
  // Sales/inventory tests share fixtures created in `beforeAll` and mutate shared state
  // (stock levels, order counts) across their `it` blocks — running test files in parallel
  // workers is fine (separate files), but within a file, tests must run in the written order.
  maxWorkers: 1,
};
