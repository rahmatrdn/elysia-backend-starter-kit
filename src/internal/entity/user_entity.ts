import { type Static, t } from 'elysia';

export const CreateUserSchema = t.Object({
  name: t.String({
    minLength: 2,
    maxLength: 255,
    description: 'Full name of the user',
    examples: ['John Doe'],
    error: 'Name must be between 2 and 255 characters',
  }),
  email: t.String({
    format: 'email',
    description: 'Unique email address for authentication',
    examples: ['john.doe@example.com'],
    error: 'Valid email address is required',
  }),
  password: t.String({
    minLength: 6,
    maxLength: 100,
    description: 'Plaintext password (will be hashed using bcrypt)',
    examples: ['secret123'],
    error: 'Password must be at least 6 characters long',
  }),
  role_access: t.Optional(
    t.Number({
      minimum: 1,
      maximum: 3,
      default: 3,
      description: 'Access role level (1: Super Admin, 2: Admin, 3: User)',
      examples: [3],
      error: 'Role access must be 1 (Super Admin), 2 (Admin), or 3 (User)',
    }),
  ),
});

export type CreateUserEntity = Static<typeof CreateUserSchema>;

export const UpdateUserSchema = t.Partial(
  t.Object({
    name: t.String({
      minLength: 2,
      maxLength: 255,
      description: 'Full name of the user',
      examples: ['John Doe Updated'],
      error: 'Name must be between 2 and 255 characters',
    }),
    email: t.String({
      format: 'email',
      description: 'Unique email address for authentication',
      examples: ['john.updated@example.com'],
      error: 'Valid email address is required',
    }),
    password: t.String({
      minLength: 6,
      maxLength: 100,
      description: 'New password (will be hashed)',
      examples: ['newsecret123'],
      error: 'Password must be at least 6 characters long',
    }),
    role_access: t.Number({
      minimum: 1,
      maximum: 3,
      description: 'Access role level (1: Super Admin, 2: Admin, 3: User)',
      examples: [2],
      error: 'Role access must be 1 (Super Admin), 2 (Admin), or 3 (User)',
    }),
  }),
);

export type UpdateUserEntity = Static<typeof UpdateUserSchema>;

export const GetUsersQuerySchema = t.Object({
  page: t.Optional(
    t.Numeric({
      minimum: 1,
      default: 1,
      description: 'Page number for pagination',
      examples: [1],
    }),
  ),
  limit: t.Optional(
    t.Numeric({
      minimum: 1,
      maximum: 100,
      default: 10,
      description: 'Number of items per page (max: 100)',
      examples: [10],
    }),
  ),
  search: t.Optional(
    t.String({
      description: 'Search keyword for name or email',
      examples: ['john'],
    }),
  ),
});

export type GetUsersQueryEntity = Static<typeof GetUsersQuerySchema>;

export const GetUserParamsSchema = t.Object({
  id: t.Numeric({
    minimum: 1,
    description: 'Unique user ID primary key',
    examples: [1],
    error: 'User ID must be a positive number',
  }),
});

export type GetUserParamsEntity = Static<typeof GetUserParamsSchema>;

export const UserResponseSchema = t.Object({
  id: t.Number({ description: 'User ID', examples: [1] }),
  name: t.String({ description: 'Full name', examples: ['John Doe'] }),
  email: t.String({
    description: 'Email address',
    examples: ['john.doe@example.com'],
  }),
  email_verified_at: t.Nullable(
    t.String({ description: 'Verification timestamp ISO string' }),
  ),
  role_access: t.Number({ description: 'Role access level', examples: [3] }),
  created_at: t.String({ description: 'Record creation ISO timestamp' }),
  updated_at: t.String({ description: 'Record update ISO timestamp' }),
});

export type UserResponseEntity = Static<typeof UserResponseSchema>;
