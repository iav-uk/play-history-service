// src/routes/history.ts

import { FastifyInstance } from 'fastify';
import { historyService } from '../services/historyService';
import { HistoryParamsSchema } from '../models/types';

export default async function historyRoutes(fastify: FastifyInstance) {
  fastify.get('/v1/history/:userId', async (req, reply) => {
    const parsed = HistoryParamsSchema.safeParse({
      userId: (req.params as any).userId,
      limit: (req.query as any).limit,
      offset: (req.query as any).offset,
    });

    if (!parsed.success) {
      reply.code(400).send({
        message: 'Validation failed',
        errors: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }

    const { userId, limit, offset } = parsed.data;
    const result = await historyService.getHistory(userId, limit, offset);

    reply.code(200).send({
      userId,
      total: result.total,
      limit,
      offset,
      items: result.items,
    });
  });
}
