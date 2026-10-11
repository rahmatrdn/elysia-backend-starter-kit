import { createHash } from 'node:crypto';
import { bearer } from '@elysiajs/bearer';
import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';
import { ForbiddenError, UnauthorizedError } from '@/common/errors/app-error';
import type { JWTPayload } from '@/internal/entity/auth_entity';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function parseDurationToSeconds(
  duration: string | undefined,
  defaultSeconds = 3600,
): number {
  if (!duration) return defaultSeconds;
  const match = duration.match(/^(\d+)([smhdwy]?)$/i);
  if (!match) return defaultSeconds;
  const value = Number.parseInt(match[1], 10);
  const unit = (match[2] || 's').toLowerCase();
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    case 'w':
      return value * 604800;
    case 'y':
      return value * 31536000;
    default:
      return value;
  }
}

import { UserRepository } from '@/internal/repository/mysql/user_repository';

const userRepository = new UserRepository();

export const authPlugin = new Elysia({ name: 'auth-plugin' })
  .use(
    jwt({
      name: 'jwtAccess',
      secret: process.env.JWT_SECRET || 'default_access_secret_key_change_me',
      exp: (process.env.JWT_ACCESS_EXP || '1h') as any,
    }),
  )
  .use(
    jwt({
      name: 'jwtRefresh',
      secret:
        process.env.JWT_REFRESH_SECRET ||
        'default_refresh_secret_key_change_me',
      exp: (process.env.JWT_REFRESH_EXP || '7d') as any,
    }),
  )
  .use(bearer())
  .derive({ as: 'scoped' }, async ({ bearer, jwtAccess }) => {
    if (!bearer) return { currentUser: null as JWTPayload | null };

    const payload = (await jwtAccess.verify(bearer)) as unknown as
      | JWTPayload
      | false;
    if (!payload || typeof payload !== 'object' || !payload.id) {
      return { currentUser: null as JWTPayload | null };
    }

    // Verify user exists and session has not been revoked (via logout)
    const user = await userRepository.findById(Number(payload.id));
    if (!user?.rememberToken) {
      return { currentUser: null as JWTPayload | null };
    }

    // If token includes session_hash, verify it matches active session
    if (
      payload.session_hash &&
      user.rememberToken.substring(0, 16) !== payload.session_hash
    ) {
      return { currentUser: null as JWTPayload | null };
    }

    return {
      currentUser: {
        id: Number(payload.id),
        email: String(payload.email),
        role_access: Number(user.roleAccess),
        session_hash: payload.session_hash,
      } satisfies JWTPayload,
    };
  })
  .macro({
    isAuth: (enabled: boolean) => ({
      async beforeHandle({ bearer, currentUser }) {
        if (!enabled) return;

        if (!bearer) {
          throw new UnauthorizedError('Authentication token is required');
        }

        if (!currentUser) {
          throw new UnauthorizedError(
            'Token is invalid, expired, or has been revoked',
          );
        }
      },
    }),
    hasRole: (roles: number[]) => ({
      async beforeHandle({ currentUser }) {
        if (!currentUser) {
          throw new UnauthorizedError('Authentication required');
        }

        if (!roles.includes(currentUser.role_access)) {
          throw new ForbiddenError(
            'You do not have permission to perform this action',
          );
        }
      },
    }),
  });
