// src/routes/gdpr.ts

import { FastifyInstance } from 'fastify';
import { UserIdSchema } from '../models/types';
import { gdprService } from '../services/gdprService';

export default async function gdprRoutes(app: FastifyInstance) {
  app.delete('/v1/users/:userId', async (req, reply) => {
    const parsed = UserIdSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.code(400).send({
        message: 'Validation failed',
        errors: parsed.error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { userId } = parsed.data;

    try {
      const count = await gdprService.deleteUserData(userId);
      reply.code(200).send({
        message: 'User data deleted under GDPR',
        userId,
        deletedRecords: count,
      });
    } catch (err: any) {
      req.log.error({ err }, 'GDPR delete failed');
      reply.code(500).send({ message: 'Internal Server Error', details: err.message });
    }
  });
}
