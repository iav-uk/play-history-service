// src/routes/mostWatched.ts

import { FastifyInstance } from 'fastify';
import { aggregationService } from '../services/aggregationService';
import { DateRangeSchema } from '../models/types';

export default async function mostWatchedRoutes(fastify: FastifyInstance) {
  fastify.get('/v1/most-watched', async (req, reply) => {
    const parsed = DateRangeSchema.safeParse(req.query);

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

    const { from, to } = parsed.data;
    const items = await aggregationService.getMostWatched(from, to);

    reply.code(200).send({ from, to, items });
  });
}
