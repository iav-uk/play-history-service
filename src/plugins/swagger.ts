// TODO: sketch only, fix install and import failing on "npm install"

import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export default fp(async (fastify) => {
  // register OpenAPI schema generator
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Play History Service API',
        description: 'API documentation for the Play History and GDPR service',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local development' },
        { url: 'http://localhost:8080', description: 'Docker environment' },
      ],
      tags: [
        { name: 'Play', description: 'Record play events' },
        { name: 'History', description: 'View user play history' },
        { name: 'Most Watched', description: 'Top watched content' },
        { name: 'GDPR', description: 'User data deletion endpoints' },
        { name: 'Health', description: 'Service health and diagnostics' },
      ],
    },
  });

  // register Swagger UI endpoint
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
});
