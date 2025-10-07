// src/db/testConnnection.ts

import { query } from './pg';
import { logger } from '../utils/logger';

(async () => {
  try {
    const result = await query('SELECT current_database(), current_user;');
    logger.info('Connected to:', result.rows[0]);
    process.exit(0);
  } catch (err) {
    logger.error(`Connection failed: ${err}`);
    process.exit(1);
  }
})();

// [DEV NOTE] localhost connection testable with "npx ts-node src/db/testConnection.ts"
// successful output "Connected to: { current_database: 'play_history_service', current_user: 'postgres' }"
