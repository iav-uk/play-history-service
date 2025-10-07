import { buildApp } from '../app';
import { query } from '../db/pg';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { setupTestDB } from './setupTestDB';

let app: FastifyInstance;

const contentA = randomUUID();
const contentB = randomUUID();

beforeAll(async () => {
  await setupTestDB(); // ensures plays table exists
  app = await buildApp();
  await query('DELETE FROM plays');
  const now = new Date();

  // 3 plays of contentA, 2 of contentB
  for (let i = 0; i < 3; i++) {
    await query(
      `INSERT INTO plays (event_id, user_id, content_id, device, playback_duration, played_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        randomUUID(),
        randomUUID(),
        contentA,
        'web',
        120,
        new Date(now.getTime() - i * 60000).toISOString(),
      ],
    );
  }

  for (let i = 0; i < 2; i++) {
    await query(
      `INSERT INTO plays (event_id, user_id, content_id, device, playback_duration, played_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        randomUUID(),
        randomUUID(),
        contentB,
        'tv',
        200,
        new Date(now.getTime() - i * 120000).toISOString(),
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

describe('GET /v1/most-watched', () => {
  it('should return ranked content within date range', async () => {
    const from = new Date(Date.now() - 3600000).toISOString();
    const to = new Date(Date.now() + 3600000).toISOString();

    const res = await app.inject({
      method: 'GET',
      url: `/v1/most-watched?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0].totalPlays).toBeGreaterThanOrEqual(body.items[1].totalPlays);
  });

  it('should validate missing/invalid params', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/most-watched?from=bad&to=2025-10-06T00:00:00Z',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return empty array if no plays in range', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/most-watched?from=2025-01-01T00:00:00Z&to=2025-01-02T00:00:00Z',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.items).toEqual([]);
  });

  it('should return validation error if from > to', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/most-watched?from=2025-10-10T00:00:00Z&to=2025-10-01T00:00:00Z',
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('Validation failed');
  });

  it('should return validation error for invalid dates', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/most-watched?from=invalid&to=2025-10-01T00:00:00Z',
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('Validation failed');
  });
});
