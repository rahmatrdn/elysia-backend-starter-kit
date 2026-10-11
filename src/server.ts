import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { errorHandlerPlugin } from '@/common/errors/error-handler';
import { httpLogger } from '@/config/http_logger';
import { authHandler } from '@/internal/http/handler/public/auth_handler';
import { userHandler } from '@/internal/http/handler/user_handler';

export const app = new Elysia()
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: process.env.APP_NAME || 'Elysia Starter Kit API',
          version: '1.0.0',
          description:
            'API Documentation built with ElysiaJS Clean Architecture & JWT Authorization',
        },
        tags: [
          {
            name: 'Authentication',
            description: 'Authentication & token management endpoints',
          },
          { name: 'Users', description: 'User management endpoints' },
        ],
        components: {
          securitySchemes: {
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Enter your JWT access token',
            },
          },
        },
      },
    }),
  )
  .use(httpLogger)
  .use(errorHandlerPlugin)
  .get('/', () => ({
    success: true,
    message: `Starting service - ${process.env.APP_PORT ?? 3010}`,
  }))
  .use(authHandler)
  .use(userHandler)
  .listen(process.env.PORT ?? 3010);

console.log(
  `🦊 [${process.env.NODE_ENV}] ${process.env.APP_NAME} is running at ${app.server?.hostname}:${app.server?.port}`,
);
console.log(
  `📚 Swagger documentation available at http://${app.server?.hostname}:${app.server?.port}/swagger`,
);

export type App = typeof app;
