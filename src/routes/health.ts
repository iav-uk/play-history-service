// src/routes/health.ts

import { FastifyInstance } from 'fastify';
import { query, initDB } from '../db/pg';
import { detectEnvironment } from '../utils/environment';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_, reply) => {
    try {
      const envInfo = detectEnvironment();
      await initDB();
      const result = await query('SELECT NOW()');
      reply.code(200).send({
        status: 'ok',
        db: result.rows[0].db,
        timestamp: new Date().toISOString(),
        env: envInfo,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      reply.status(500).send({ status: 'error', message: message || 'DB connection failed' });
    }
  });
}
