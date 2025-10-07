import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { logger } from '../utils/logger';

// detect baseDir: src (local) or dist (Docker)
const baseDir = fs.existsSync(path.resolve(process.cwd(), 'src')) ? 'src' : 'dist';

// pick environment file depending on context
const nodeEnv = process.env.NODE_ENV || 'test';
const isDocker =
  process.env.DOCKER_ENV === 'true' || (process.env.HOSTNAME || '').includes('docker');

let envFile = '.env.test';
if (isDocker) envFile = '.env.docker';
else if (nodeEnv === 'development') envFile = '.env.local';

const envPath = path.resolve(process.cwd(), `${baseDir}/config`, envFile);
logger.info(`[ENV TEST] Loading ${envFile} from ${envPath}`);

dotenv.config({ path: envPath });

describe('Environment variables', () => {
  it('should load DB configuration', () => {
    expect(process.env.DB_NAME).toBeDefined();
    expect(process.env.DB_NAME).toContain('play_history_service');
  });
});
