import Fastify from 'fastify';
import playRoutes from './routes/play';
import historyRoutes from './routes/history';
import mostWatchedRoutes from './routes/mostWatched';
import healthRoutes from './routes/health';
import gdprRoutes from './routes/gdpr';
import swaggerPlugin from './plugins/swagger';
import corsPlugin from './plugins/cors';

export async function buildApp() {
  const fastify = Fastify({ logger: true });

  // Custom global error handler (see below)
  fastify.setErrorHandler((error, req, reply) => {
    req.log.error({ err: error, path: req.url }, 'Unhandled error');
    const statusCode = error.statusCode ?? 500;
    reply.code(statusCode).send({
      message: error.message || 'Internal Server Error',
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  });

  await fastify.register(swaggerPlugin);
  await fastify.register(corsPlugin);

  // register all routes
  await fastify.register(playRoutes);
  await fastify.register(historyRoutes);
  await fastify.register(mostWatchedRoutes);
  await fastify.register(healthRoutes);
  await fastify.register(gdprRoutes);

  await fastify.ready(); // ensures all routes/plugins loaded

  console.log('=== REGISTERED ROUTES ===');
  console.log(fastify.printRoutes());
  console.log('=========================');

  return fastify;
}
