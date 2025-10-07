// src/db/pg.ts

import { loadEnv } from '../config/envLoader';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { InternalError } from '../utils/errors';
import { logger } from '../utils/logger';

const config = loadEnv();

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 1000;

let pool: Pool;

// attempts to connect to the database with retries.
// uses exponential backoff for resilience during startup or transient failures.
async function connectWithRetry(): Promise<Pool> {
  let attempt = 1;

  while (attempt <= MAX_RETRIES) {
    try {
      const pool = new Pool({
        host: config.dbHost,
        port: config.dbPort,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbName,
        max: 10, // number of connections in pool
        idleTimeoutMillis: 100, // close idle connections
        connectionTimeoutMillis: 5000, // timeout if DB not responding
      });

      // simple connection test
      await pool.query('SELECT 1');

      logger.info(
        `[DB] Connected to PostgreSQL database "${config.dbName}" (attempt ${attempt}) at ${config.dbHost}:${config.dbPort}`,
      );

      return pool;
    } catch (err: any) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      logger.warn(`[DB] Connection attempt ${attempt} failed: ${err.message}`);

      if (attempt < MAX_RETRIES) {
        logger.warn(`[DB] Retrying in ${(delay / 1000).toFixed(1)}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        logger.error('[DB] Max retries reached. Exiting.');
        process.exit(1);
      }

      attempt++;
    }
  }

  // should never reach here
  throw InternalError('Unexpected database connection failure');
}

// initializes the connection pool with retry and reconnection logic.
export async function initDB() {
  pool = await connectWithRetry();

  // handle unexpected errors from idle clients gracefully
  pool.on('error', (err) => {
    logger.error(`[DB] Unexpected error on idle client: ${err.message}`);
    connectWithRetry()
      .then((newPool) => {
        logger.info('[DB] Reconnected to database successfully.');
        pool = newPool;
      })
      .catch((e) => {
        logger.error('[DB] Failed to reconnect to database.', e);
      });
  });
}

// exports a query helper that uses the shared pool instance.
export const query = (text: string, params?: any[]) => {
  if (!pool) {
    throw InternalError('[DB] Pool not initialized. call initDB()?');
  }
  return pool.query(text, params);
};

// allows you to manually get a client for transactions.
export const getClient = async () => {
  if (!pool) {
    throw InternalError('[DB] Pool not initialized.');
  }
  return pool.connect();
};

export async function closeDB() {
  if (!pool) {
    logger.warn('[DB] closeDB called but pool was never initialized');
    return;
  }
  if (pool) {
    await pool.end();
    logger.info('[DB] Pool has been closed (tests or shutdown)');
  }
}

export async function runMigrations() {
  const migrationDir = path.resolve(__dirname, '../../migrations');
  const files = fs
    .readdirSync(migrationDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    logger.info(`[DB] Running migration: ${file}`);
    await query(sql);
  }
}

export default { initDB, query, getClient };
