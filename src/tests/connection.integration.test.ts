import { initDB, query } from '../db/pg';

describe('Database connection', () => {
  beforeAll(async () => {
    await initDB(); // ensure pool is ready
  });

  it('should connect and run a simple query', async () => {
    const result = await query('SELECT 1 as value');
    expect(result.rows[0].value).toBe(1);
  });

  it('should confirm DB schema exists', async () => {
    const result = await query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`,
    );
    const tableNames = result.rows.map((r) => r.table_name);

    // ensure critical table exists (plays)
    expect(tableNames).toContain('plays');
  });
});
