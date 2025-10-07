import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../utils/logger';

export interface EnvConfig {
  nodeEnv: string;
  isDocker: boolean;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
}

export function loadEnv() {
  const isDocker = process.env.DOCKER_ENV === 'true' || process.env.HOSTNAME?.includes('docker');
  const nodeEnv = process.env.NODE_ENV || 'development';

  let envFile = '.env.local';
  if (nodeEnv === 'test') envFile = '.env.test';
  else if (isDocker) envFile = '.env.docker';

  const envPath = path.resolve(__dirname, envFile);
  dotenv.config({ path: envPath });

  logger.info(`[ENV] Loaded ${envFile} (${nodeEnv})`);

  return {
    nodeEnv,
    isDocker,
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: Number(process.env.DB_PORT) || 5432,
    dbUser: process.env.DB_USER || 'postgres',
    dbPassword: process.env.DB_PASSWORD || 'postgres',
    dbName: process.env.DB_NAME || 'play_history_service',
  };
}
