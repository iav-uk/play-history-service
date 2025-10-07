import { buildApp } from '../app';
import { query } from '../db/pg';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { setupTestDB } from './setupTestDB';

let app: FastifyInstance;

beforeAll(async () => {
  await setupTestDB(); // ensures plays table exists
  app = await buildApp();
  await query('DELETE FROM plays'); // clean table
});

afterAll(async () => {
  if (app?.close) {
    await app.close();
  }
  await new Promise((resolve) => setTimeout(resolve, 20)); // small delay helps Jest flush logs
});

describe('POST /v1/play', () => {
  it('should insert a valid play event', async () => {
    const payload = {
      eventId: randomUUID(),
      userId: randomUUID(),
      contentId: randomUUID(),
      device: 'web',
      playbackDuration: 120,
      playedAt: '2025-10-06T10:00:00Z',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/v1/play',
      payload,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');

    const dbCheck = await query('SELECT * FROM plays WHERE event_id=$1', [payload.eventId]);
    expect(dbCheck.rows.length).toBe(1);
  });

  it('should reject missing required fields', async () => {
    const payload = {
      eventId: randomUUID(),
      userId: randomUUID(),
      playbackDuration: 120,
    };

    const res = await app.inject({
      method: 'POST',
      url: '/v1/play',
      payload,
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('Validation failed');
    expect(body.errors.some((e: any) => e.path.includes('contentId'))).toBeTruthy();
  });

  it('should reject invalid UUIDs', async () => {
    const payload = {
      eventId: 'not-a-uuid',
      userId: randomUUID(),
      contentId: randomUUID(),
      device: 'mobile',
      playbackDuration: 100,
      playedAt: '2025-10-06T10:30:00Z',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/v1/play',
      payload,
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.errors.some((e: any) => e.path.includes('eventId'))).toBeTruthy();
  });

  it('should reject negative or zero playback duration', async () => {
    const payload = {
      eventId: randomUUID(),
      userId: randomUUID(),
      contentId: randomUUID(),
      device: 'tv',
      playbackDuration: -5,
      playedAt: '2025-10-06T11:00:00Z',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/v1/play',
      payload,
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.errors.some((e: any) => e.path.includes('playbackDuration'))).toBeTruthy();
  });

  it('should reject invalid timestamp', async () => {
    const payload = {
      eventId: randomUUID(),
      userId: randomUUID(),
      contentId: randomUUID(),
      device: 'web',
      playbackDuration: 100,
      playedAt: 'invalid-date',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/v1/play',
      payload,
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.errors.some((e: any) => e.path.includes('playedAt'))).toBeTruthy();
  });

  it('should handle duplicate event_id gracefully (idempotent)', async () => {
    const idempotentId = randomUUID();
    const payload = {
      eventId: idempotentId,
      userId: randomUUID(),
      contentId: randomUUID(),
      device: 'web',
      playbackDuration: 100,
      playedAt: '2025-10-06T12:00:00Z',
    };

    // first insert
    const first = await app.inject({ method: 'POST', url: '/v1/play', payload });
    expect(first.statusCode).toBe(200);

    // second insert (duplicate)
    const second = await app.inject({ method: 'POST', url: '/v1/play', payload });
    expect(second.statusCode).toBe(200);
    const body = JSON.parse(second.body);
    expect(body.message).toContain('Duplicate event ignored');

    // DB should only have one record
    const dbCheck = await query('SELECT * FROM plays WHERE event_id=$1', [idempotentId]);
    expect(dbCheck.rows.length).toBe(1);
  });
});
