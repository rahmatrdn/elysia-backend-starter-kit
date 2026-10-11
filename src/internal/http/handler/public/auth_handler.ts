import { Elysia } from 'elysia';
import { UnauthorizedError } from '@/common/errors/app-error';
import { authPlugin } from '@/common/middleware/auth';
import {
  LoginSchema,
  RefreshTokenSchema,
  RegisterSchema,
} from '@/internal/entity/auth_entity';
import { jsonResponse } from '@/internal/presenter/json';
import { UserRepository } from '@/internal/repository/mysql/user_repository';
import { AuthUseCase } from '@/internal/usecase/auth/auth_usecase';

const userRepository = new UserRepository();
const authUseCase = new AuthUseCase(userRepository);

export const authHandler = new Elysia({ prefix: '/auth' })
  .use(authPlugin)
  .post(
    '/register',
    async ({ body, set }) => {
      const result = await authUseCase.register(body);

      return jsonResponse({
        set,
        statusCode: 201,
        message: 'User registered successfully',
        data: result,
      });
    },
    {
      body: RegisterSchema,
      detail: {
        tags: ['Authentication'],
        summary: 'Register',
      },
    },
  )
  .post(
    '/login',
    async ({ body, jwtAccess, jwtRefresh, set }) => {
      const result = await authUseCase.login(body, jwtAccess, jwtRefresh);

      return jsonResponse({
        set,
        statusCode: 200,
        message: 'Login successful',
        data: result,
      });
    },
    {
      body: LoginSchema,
      detail: {
        tags: ['Authentication'],
        summary: 'Login',
      },
    },
  )
  .post(
    '/refresh',
    async ({ body, jwtAccess, jwtRefresh, set }) => {
      const result = await authUseCase.refreshToken(
        body,
        jwtAccess,
        jwtRefresh,
      );

      return jsonResponse({
        set,
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: result,
      });
    },
    {
      body: RefreshTokenSchema,
      detail: {
        tags: ['Authentication'],
        summary: 'Refresh Token',
      },
    },
  )
  .post(
    '/logout',
    async ({ currentUser, set }) => {
      if (!currentUser) {
        throw new UnauthorizedError('Authentication token is required');
      }

      await authUseCase.logout(currentUser.id);

      return jsonResponse({
        set,
        statusCode: 200,
        message: 'Logout successful',
      });
    },
    {
      isAuth: true,
      detail: {
        tags: ['Authentication'],
        summary: 'Logout',
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .get(
    '/me',
    async ({ currentUser, set }) => {
      if (!currentUser) {
        throw new UnauthorizedError('Authentication token is required');
      }

      const profile = await authUseCase.getProfile(currentUser.id);

      return jsonResponse({
        set,
        statusCode: 200,
        message: 'Profile retrieved successfully',
        data: profile,
      });
    },
    {
      isAuth: true,
      detail: {
        tags: ['Authentication'],
        summary: 'Me',
        security: [{ BearerAuth: [] }],
      },
    },
  );
