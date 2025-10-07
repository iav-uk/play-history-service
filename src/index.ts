import { query, initDB, closeDB, runMigrations } from './db/pg';
import { buildApp } from './app';
import { detectEnvironment } from './utils/environment';
import { loadEnv } from './config/envLoader';

loadEnv();

const start = async () => {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 3000;

  try {
    const envInfo = detectEnvironment();

    await initDB(); // waits for DB connection before continuing
    await runMigrations();
    console.log('[INIT] Database ready, starting server...');

    console.log('──────────────────────────────────────');
    console.log(`Environment: ${envInfo.environment}`);
    console.log(`Hostname: ${envInfo.hostname}`);
    console.log(`Startup: ${envInfo.timestamp}`);
    console.log(`DB Host: ${envInfo.dbHost}`);
    console.log(`DB Name: ${envInfo.dbName}`);
    console.log('──────────────────────────────────────');

    const result = await query('SELECT current_database() as db');
    console.log(`[INFO] Connected to PostgreSQL database: ${result.rows[0].db}`);

    await app.listen({ port, host: '0.0.0.0' });
    console.log(`[INFO] Server running on port ${port}`);

    // graceful shutdown for the app
    process.on('SIGINT', async () => {
      console.log('[SERVER] Received SIGINT. Cleaning up...');
      await closeDB();
      process.exit(0);
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
