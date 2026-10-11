import { Elysia } from 'elysia';
import { RoleAccess } from '@/common/enums/role';
import { UnauthorizedError } from '@/common/errors/app-error';
import { authPlugin } from '@/common/middleware/auth';
import {
  CreateUserSchema,
  GetUserParamsSchema,
  GetUsersQuerySchema,
  UpdateUserSchema,
} from '@/internal/entity/user_entity';
import { jsonResponse } from '@/internal/presenter/json';
import {
  type IUserRepository,
  UserRepository,
} from '@/internal/repository/mysql/user_repository';
import {
  type IUserUseCase,
  UserUseCase,
} from '@/internal/usecase/user/user_usecase';
import { useLogger } from 'logixlysia'

const userRepository: IUserRepository = new UserRepository();
const userUseCase: IUserUseCase = new UserUseCase(userRepository);

export const userHandler = new Elysia({ prefix: '/internal/users' })
  .use(authPlugin)
  .post(
    '/',
    async ({ body, set }) => {
      const user = await userUseCase.createUser(body);

      return jsonResponse({
        set,
        statusCode: 200,
        message: 'User created successfully',
        data: user,
      });
    },
    {
      isAuth: true,
      hasRole: [RoleAccess.SUPER_ADMIN, RoleAccess.ADMIN],
      body: CreateUserSchema,
      detail: {
        tags: ['Users'],
        summary: 'Create a new user',
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .get(
    '/',
    async ({ query, set }) => {
      const result = await userUseCase.getUsers(query);

      const log = useLogger()

      log.mergeContext({ userId: "123qs" })
      log.error('Fetched user profile')

      return jsonResponse({
        set,
        statusCode: 200,
        message: 'Users retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    },
    {
      isAuth: true,
      hasRole: [RoleAccess.SUPER_ADMIN, RoleAccess.ADMIN],
      query: GetUsersQuerySchema,
      detail: {
        tags: ['Users'],
        summary: 'Get paginated users list',
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .get(
    '/:id',
    async ({ currentUser, params, set }) => {
      if (!currentUser) {
        throw new UnauthorizedError('Authentication token is required');
      }

      const user = await userUseCase.getUserById(params.id, currentUser);

      return jsonResponse({
        set,
        statusCode: 200,
        message: 'User retrieved successfully',
        data: user,
      });
    },
    {
      isAuth: true,
      params: GetUserParamsSchema,
      detail: {
        tags: ['Users'],
        summary: 'Get user details by ID (Admin, Super Admin, or Self)',
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .put(
    '/:id',
    async ({ currentUser, params, body, set }) => {
      if (!currentUser) {
        throw new UnauthorizedError('Authentication token is required');
      }

      const user = await userUseCase.updateUser(params.id, body, currentUser);

      return jsonResponse({
        set,
        statusCode: 200,
        message: 'User updated successfully',
        data: user,
      });
    },
    {
      isAuth: true,
      params: GetUserParamsSchema,
      body: UpdateUserSchema,
      detail: {
        tags: ['Users'],
        summary: 'Update user by ID (Admin, Super Admin, or Self)',
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .delete(
    '/:id',
    async ({ currentUser, params, set }) => {
      if (!currentUser) {
        throw new UnauthorizedError('Authentication token is required');
      }

      await userUseCase.deleteUser(params.id, currentUser);

      return jsonResponse({
        set,
        statusCode: 200,
        message: 'User deleted successfully',
      });
    },
    {
      isAuth: true,
      hasRole: [RoleAccess.SUPER_ADMIN],
      params: GetUserParamsSchema,
      detail: {
        tags: ['Users'],
        summary: 'Delete user by ID (Super Admin only)',
        security: [{ BearerAuth: [] }],
      },
    },
  );
