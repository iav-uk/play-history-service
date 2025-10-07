import fp from 'fastify-plugin';
import cors from '@fastify/cors';

// CORS Plugin (configurable env)
export default fp(async (fastify) => {
  const originsEnv = process.env.CORS_ORIGINS ?? '';
  const allowedOrigins = originsEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true); // allow requests with no origin (like curl / Postman)
        return;
      }

      // if .env is empty, allow localhost by default for dev
      if (
        allowedOrigins.length === 0 &&
        (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))
      ) {
        cb(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  fastify.log.info(`[CORS] Allowed origins: ${allowedOrigins.join(', ') || '(default localhost)'}`);
});
