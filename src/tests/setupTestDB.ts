import { initDB, query } from '../db/pg';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export async function setupTestDB() {
  await initDB();

  const possiblePaths = [
    path.resolve(__dirname, '../../migrations/001_create_plays.sql'), // local (src)
    path.resolve(__dirname, '../migrations/001_create_plays.sql'), // compiled (dist)
  ];

  const migrationPath = possiblePaths.find((p) => fs.existsSync(p));
  if (!migrationPath) {
    logger.error('[TEST] Migration file not found in expected locations:');
    logger.error(possiblePaths.join('\n'));
    throw new Error('Missing migrations — check Dockerfile COPY directives.');
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  await query(migrationSQL);

  logger.info(`[TEST] Applied migrations from ${migrationPath}`);
}
