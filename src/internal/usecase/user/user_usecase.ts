import { RoleAccess } from '@/common/enums/role';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from '@/common/errors/app-error';
import logger, { createScopedLogger } from '@/config/logger';
import type { NewUser, User } from '@/db/schema';
import type {
  CreateUserEntity,
  GetUsersQueryEntity,
  UpdateUserEntity,
  UserResponseEntity,
} from '@/internal/entity/user_entity';
import type { IUserRepository } from '@/internal/repository/mysql/user_repository';

export interface AuthContext {
  id: number;
  role_access: number;
}

export interface PaginatedUsersResponseEntity {
  data: UserResponseEntity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IUserUseCase {
  createUser(dto: CreateUserEntity): Promise<UserResponseEntity>;
  getUserById(
    id: number,
    authContext?: AuthContext,
  ): Promise<UserResponseEntity>;
  getUsers(query: GetUsersQueryEntity): Promise<PaginatedUsersResponseEntity>;
  updateUser(
    id: number,
    dto: UpdateUserEntity,
    authContext?: AuthContext,
  ): Promise<UserResponseEntity>;
  deleteUser(id: number, authContext?: AuthContext): Promise<void>;
}

export class UserUseCase implements IUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  private readonly logger = createScopedLogger('UserUseCase');

  private mapToUserResponse(user: User): UserResponseEntity {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      email_verified_at: user.emailVerifiedAt
        ? user.emailVerifiedAt.toISOString()
        : null,
      role_access: user.roleAccess,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }

  async createUser(dto: CreateUserEntity): Promise<UserResponseEntity> {
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
        roleAccess: dto.role_access ?? 3,
      });

      return this.mapToUserResponse(newUser);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `Failed to create user: ${error.message || error}`,
      );
    }
  }

  async getUserById(
    id: number,
    authContext?: AuthContext,
  ): Promise<UserResponseEntity> {
    try {
      if (
        authContext &&
        authContext.role_access === RoleAccess.USER &&
        authContext.id !== id
      ) {
        throw new ForbiddenError(
          "You do not have permission to view other users' profiles",
        );
      }

      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundError(`User with ID ${id} was not found`);
      }

      return this.mapToUserResponse(user);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `Failed to retrieve user: ${error.message || error}`,
      );
    }
  }

  async getUsers(
    query: GetUsersQueryEntity,
  ): Promise<PaginatedUsersResponseEntity> {
    const funcName = 'getUsers';

    try {
      const result = await this.userRepository.findMany(query);
      xx;
      return {
        data: result.data.map((user) => this.mapToUserResponse(user)),
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      };
    } catch (error: any) {
      this.logger.error({ err: error, errMessage: error.message }, funcName);

      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `Failed to fetch users: ${error.message || error}`,
      );
    }
  }

  async updateUser(
    id: number,
    dto: UpdateUserEntity,
    authContext?: AuthContext,
  ): Promise<UserResponseEntity> {
    try {
      if (authContext && authContext.role_access === RoleAccess.USER) {
        if (authContext.id !== id) {
          throw new ForbiddenError(
            "You do not have permission to update other users' profiles",
          );
        }
        if (dto.role_access !== undefined) {
          throw new ForbiddenError(
            'You do not have permission to modify role access levels',
          );
        }
      }

      const updatedUser =
        await this.userRepository.updateWithTransactionAndLock(
          id,
          async (lockedUser, tx) => {
            const updateData: Partial<NewUser> = {};

            if (dto.name !== undefined) {
              updateData.name = dto.name.trim();
            }

            if (dto.email !== undefined) {
              const normalizedEmail = dto.email.toLowerCase().trim();
              if (normalizedEmail !== lockedUser.email) {
                const emailUser = await this.userRepository.findByEmail(
                  normalizedEmail,
                  tx,
                );
                if (emailUser) {
                  throw new ConflictError(
                    `Email '${normalizedEmail}' is already registered`,
                  );
                }
              }
              updateData.email = normalizedEmail;
            }

            if (dto.password !== undefined) {
              updateData.password = await Bun.password.hash(dto.password, {
                algorithm: 'bcrypt',
                cost: 10,
              });
            }

            if (dto.role_access !== undefined) {
              updateData.roleAccess = dto.role_access;
            }

            return updateData;
          },
        );

      return this.mapToUserResponse(updatedUser);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `Failed to update user: ${error.message || error}`,
      );
    }
  }

  async deleteUser(id: number, authContext?: AuthContext): Promise<void> {
    try {
      if (authContext && authContext.role_access !== RoleAccess.SUPER_ADMIN) {
        throw new ForbiddenError('Only Super Admin can delete user accounts');
      }

      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new NotFoundError(`User with ID ${id} was not found`);
      }

      await this.userRepository.delete(id);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `Failed to delete user: ${error.message || error}`,
      );
    }
  }
}
