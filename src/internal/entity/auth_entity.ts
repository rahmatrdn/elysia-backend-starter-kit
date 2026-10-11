import { type Static, t } from 'elysia';

export const LoginSchema = t.Object({
  email: t.String({
    format: 'email',
    description: 'Registered user email address',
    examples: ['admin@example.com'],
    error: 'Valid email address is required',
  }),
  password: t.String({
    minLength: 1,
    description: 'User password',
    examples: ['secret123'],
    error: 'Password is required',
  }),
});

export type LoginEntity = Static<typeof LoginSchema>;

export const RegisterSchema = t.Object({
  name: t.String({
    minLength: 2,
    maxLength: 255,
    description: 'Full name of the user',
    examples: ['Jane Doe'],
    error: 'Name must be between 2 and 255 characters',
  }),
  email: t.String({
    format: 'email',
    description: 'Unique email address for registration',
    examples: ['jane.doe@example.com'],
    error: 'Valid email address is required',
  }),
  password: t.String({
    minLength: 6,
    maxLength: 100,
    description: 'User password',
    examples: ['secret123'],
    error: 'Password must be at least 6 characters long',
  }),
});

export type RegisterEntity = Static<typeof RegisterSchema>;

export const RefreshTokenSchema = t.Object({
  refresh_token: t.String({
    minLength: 1,
    description: 'Valid refresh token string',
    error: 'Refresh token is required',
  }),
});

export type RefreshTokenEntity = Static<typeof RefreshTokenSchema>;

export const TokenResponseSchema = t.Object({
  access_token: t.String({ description: 'JWT Access token' }),
  refresh_token: t.String({ description: 'JWT Refresh token' }),
  token_type: t.String({ default: 'Bearer', description: 'Token type' }),
  expires_in: t.Number({ description: 'Access token expiration in seconds' }),
});

export type TokenResponseEntity = Static<typeof TokenResponseSchema>;

export const AuthUserSchema = t.Object({
  id: t.Number({ description: 'User ID' }),
  name: t.String({ description: 'Full name' }),
  email: t.String({ description: 'Email address' }),
  role_access: t.Number({ description: 'Role access level' }),
  created_at: t.String({ description: 'Account creation ISO timestamp' }),
});

export type AuthUserEntity = Static<typeof AuthUserSchema>;

export interface JWTPayload {
  id: number;
  email: string;
  role_access: number;
  session_hash?: string;
}
