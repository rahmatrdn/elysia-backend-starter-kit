import { RoleAccess } from '@/common/enums/role';
import {
  AppError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from '@/common/errors/app-error';
import { hashToken, parseDurationToSeconds } from '@/common/middleware/auth';
import type {
  AuthUserEntity,
  LoginEntity,
  RefreshTokenEntity,
  RegisterEntity,
  TokenResponseEntity,
} from '@/internal/entity/auth_entity';
import type { IUserRepository } from '@/internal/repository/mysql/user_repository';

export interface IAuthUseCase {
  register(dto: RegisterEntity): Promise<AuthUserEntity>;
  login(
    dto: LoginEntity,
    jwtAccess: { sign: (payload: any) => Promise<string> },
    jwtRefresh: { sign: (payload: any) => Promise<string> },
  ): Promise<TokenResponseEntity>;
  refreshToken(
    dto: RefreshTokenEntity,
    jwtAccess: { sign: (payload: any) => Promise<string> },
    jwtRefresh: {
      sign: (payload: any) => Promise<string>;
      verify: (token: string) => Promise<any>;
    },
  ): Promise<TokenResponseEntity>;
  logout(userId: number): Promise<void>;
  getProfile(userId: number): Promise<AuthUserEntity>;
}

export class AuthUseCase implements IAuthUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async register(dto: RegisterEntity): Promise<AuthUserEntity> {
    try {
      const normalizedEmail = dto.email.toLowerCase().trim();
      const existingUser =
        await this.userRepository.findByEmail(normalizedEmail);

      if (existingUser) {
        throw new ConflictError(
          `Email '${normalizedEmail}' is already registered`,
        );
      }

      const hashedPassword = await Bun.password.hash(dto.password, {
        algorithm: 'bcrypt',
        cost: 10,
      });

      const newUser = await this.userRepository.create({
        name: dto.name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        roleAccess: RoleAccess.USER,
      });

      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role_access: newUser.roleAccess,
        created_at: newUser.createdAt.toISOString(),
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `Failed to register user: ${error.message || error}`,
      );
    }
  }

  async login(
    dto: LoginEntity,
    jwtAccess: { sign: (payload: any) => Promise<string> },
    jwtRefresh: { sign: (payload: any) => Promise<string> },
  ): Promise<TokenResponseEntity> {
    try {
      const normalizedEmail = dto.email.toLowerCase().trim();
      const user = await this.userRepository.findByEmail(normalizedEmail);

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isPasswordValid = await Bun.password.verify(
        dto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const refreshToken = await jwtRefresh.sign({ id: user.id });
      const refreshTokenHash = hashToken(refreshToken);
      await this.userRepository.updateRememberToken(user.id, refreshTokenHash);

      const payload = {
        id: user.id,
        email: user.email,
        role_access: user.roleAccess,
        session_hash: refreshTokenHash.substring(0, 16),
      };

      const accessToken = await jwtAccess.sign(payload);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: parseDurationToSeconds(process.env.JWT_ACCESS_EXP, 3600),
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `Failed to authenticate: ${error.message || error}`,
      );
    }
  }

  async refreshToken(
    dto: RefreshTokenEntity,
    jwtAccess: { sign: (payload: any) => Promise<string> },
    jwtRefresh: {
      sign: (payload: any) => Promise<string>;
      verify: (token: string) => Promise<any>;
    },
  ): Promise<TokenResponseEntity> {
    try {
      const payload = await jwtRefresh.verify(dto.refresh_token);
      if (!payload || typeof payload !== 'object' || !payload.id) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      const tokenHash = hashToken(dto.refresh_token);
      const user = await this.userRepository.findByRememberToken(tokenHash);

      if (!user || user.id !== Number(payload.id)) {
        throw new UnauthorizedError(
          'Refresh token has been revoked or is invalid',
        );
      }

      const newRefreshToken = await jwtRefresh.sign({ id: user.id });
      const newRefreshTokenHash = hashToken(newRefreshToken);
      await this.userRepository.updateRememberToken(
        user.id,
        newRefreshTokenHash,
      );

      const newAccessPayload = {
        id: user.id,
        email: user.email,
        role_access: user.roleAccess,
        session_hash: newRefreshTokenHash.substring(0, 16),
      };

      const newAccessToken = await jwtAccess.sign(newAccessPayload);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
        expires_in: parseDurationToSeconds(process.env.JWT_ACCESS_EXP, 3600),
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `Failed to refresh token: ${error.message || error}`,
      );
    }
  }

  async logout(userId: number): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} was not found`);
      }

      await this.userRepository.updateRememberToken(userId, null);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `Failed to logout user: ${error.message || error}`,
      );
    }
  }

  async getProfile(userId: number): Promise<AuthUserEntity> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} was not found`);
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role_access: user.roleAccess,
        created_at: user.createdAt.toISOString(),
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `Failed to retrieve profile: ${error.message || error}`,
      );
    }
  }
}
