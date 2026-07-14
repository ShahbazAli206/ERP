import fs from 'node:fs';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);
});
