// src/routes/play.ts

import { FastifyInstance } from 'fastify';
import { PlayEventSchema } from '../models/types';
import { playService } from '../services/playService';
import { gdprService } from '../services/gdprService';

export default async function playRoutes(fastify: FastifyInstance) {
  fastify.post('/v1/play', async (req, reply) => {
    const parsed = PlayEventSchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues;

      reply.code(400).send({
        message: 'Validation failed',
        errors: issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    const { userId } = parsed.data;
    // GDPR complience, prevent re-ingestion of deleted users
    const isDeleted = await gdprService.isUserDeleted(userId);
    if (isDeleted) {
      return reply.code(403).send({
        message: 'User data previously deleted under GDPR. Ingestion blocked.',
      });
    }

    try {
      const result = await playService.addPlay(parsed.data);

      if (!result.inserted) {
        reply.code(200).send({
          status: 'ok',
          message: 'Duplicate event ignored (idempotent)',
        });
        return;
      }
      reply.code(200).send({ status: 'ok' });
    } catch (e) {
      fastify.log.error(e);
      reply.code(500).send({ error: '[ERROR] Internal server error' });
    }
  });
}
