import { buildApp } from '../app';
import { query, initDB, closeDB } from '../db/pg';
import { randomUUID } from 'crypto';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  await initDB();
  app = await buildApp();

  // ensure table exists before running GDPR tests
  await query(`
    CREATE TABLE IF NOT EXISTS gdpr_tombstones (
      user_id UUID PRIMARY KEY,
      deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // clean test data
  await query('DELETE FROM plays');
  await query('DELETE FROM gdpr_tombstones');
});

afterAll(async () => {
  if (app?.close) await app.close();
  await closeDB();
});

describe('DELETE /v1/users/:userId (GDPR Right to be Forgotten)', () => {
  it("should delete a user's play history and record tombstone", async () => {
    const userId = randomUUID();

    // insert sample plays for user
    for (let i = 0; i < 2; i++) {
      await query(
        `INSERT INTO plays (event_id, user_id, content_id, device, playback_duration, played_at)
         VALUES ($1, $2, $3, $4, $5, now())`,
        [randomUUID(), userId, randomUUID(), 'web', 120],
      );
    }

    // call GDPR delete endpoint
    const res = await app.inject({
      method: 'DELETE',
      url: `/v1/users/${userId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('User data deleted under GDPR');
    expect(body.userId).toBe(userId);
    expect(body.deletedRecords).toBeGreaterThanOrEqual(1);

    // confirm user’s plays removed
    const plays = await query('SELECT * FROM plays WHERE user_id = $1', [userId]);
    expect(plays.rowCount).toBe(0);

    // confirm tombstone entry exists
    const tombstone = await query('SELECT * FROM gdpr_tombstones WHERE user_id = $1', [userId]);
    expect(tombstone.rowCount).toBe(1);
  });

  it('should handle non-existent user gracefully', async () => {
    const userId = randomUUID();
    const res = await app.inject({
      method: 'DELETE',
      url: `/v1/users/${userId}`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.deletedRecords).toBe(0);
  });

  it('should reject invalid UUIDs', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/users/not-a-uuid',
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('Validation failed');
    expect(body.errors[0].path).toBe('userId');
  });
});
