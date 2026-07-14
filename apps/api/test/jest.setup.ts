// Runs before the test framework and any test-file imports — sets env vars that
// `src/config/env.ts` (`import 'dotenv/config'`) will see already-populated and leave alone
// (dotenv never overwrites an existing process.env value), so this — not `.env`/`.env.test` —
// is the actual source of truth for what the app connects to during `npm test`.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./prisma/test.db';
process.env.JWT_SECRET = 'test-jwt-secret-not-for-real-use-at-least-16-chars';
process.env.JWT_EXPIRES_IN = '8h';
process.env.UPLOAD_DIR = './uploads-test';
process.env.MAX_UPLOAD_SIZE_MB = '10';
