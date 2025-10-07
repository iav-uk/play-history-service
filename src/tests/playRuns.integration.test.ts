import { buildApp } from '../app';
import { query } from '../db/pg';
import { randomUUID } from 'crypto';
import type { FastifyInstance } from 'fastify';
import { setupTestDB } from './setupTestDB';

let app: FastifyInstance;

beforeAll(async () => {
  await setupTestDB(); // ensures plays table exists
  app = await buildApp();
  await query('DELETE FROM plays');
});

afterAll(async () => {
  if (app?.close) {
    await app.close();
  }
  await new Promise((resolve) => setTimeout(resolve, 20)); // small delay helps Jest flush logs
});

test('POST /v1/play inserts a play event which just happened', async () => {
  const event = {
    eventId: randomUUID(),
    userId: randomUUID(),
    contentId: randomUUID(),
    device: 'web',
    playbackDuration: 300,
    playedAt: new Date().toISOString(),
  };

  const res = await app.inject({
    method: 'POST',
    url: '/v1/play',
    payload: event,
  });

  expect(res.statusCode).toBe(200);
  const result = await query('SELECT * FROM plays WHERE event_id = $1', [event.eventId]);
  expect(result.rows.length).toBe(1);
});
