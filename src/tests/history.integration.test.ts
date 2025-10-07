import { buildApp } from '../app';
import { query } from '../db/pg';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { setupTestDB } from './setupTestDB';

let app: FastifyInstance;
const userId = randomUUID();

beforeAll(async () => {
  await setupTestDB(); // ensures plays table exists
  app = await buildApp();
  await query('DELETE FROM plays');
  const baseTime = new Date();

  for (let i = 0; i < 5; i++) {
    await query(
      `
        INSERT INTO plays (event_id, user_id, content_id, device, playback_duration, played_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        randomUUID(),
        userId,
        randomUUID(),
        'web',
        120 + i * 10,
        new Date(baseTime.getTime() - i * 60000).toISOString(),
      ],
    );
  }
});

afterAll(async () => {
  if (app?.close) {
    await app.close();
  }
  await new Promise((resolve) => setTimeout(resolve, 20)); // small delay helps Jest flush logs
});

describe('GET /v1/history/:userId', () => {
  it('should return a user’s play history sorted by most recent', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/history/${userId}?limit=3&offset=0`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.total).toBe(5);
    expect(body.items.length).toBe(3);
    expect(new Date(body.items[0].playedAt).getTime()).toBeGreaterThan(
      new Date(body.items[1].playedAt).getTime(),
    );
  });

  it('should validate bad userId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/history/not-a-uuid`,
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('Validation failed');
  });

  it('should return empty array for user with no history', async () => {
    const newUserId = randomUUID();
    const res = await app.inject({
      method: 'GET',
      url: `/v1/history/${newUserId}`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.total).toBe(0);
    expect(body.items).toEqual([]);
  });

  it('should return empty results when offset exceeds total', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/history/${userId}?limit=2&offset=999`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.items.length).toBe(0);
  });
});
