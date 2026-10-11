import { eq, like, or, sql } from 'drizzle-orm';
import {
  AppError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from '@/common/errors/app-error';
import { db } from '@/db';
import { type NewUser, type User, users } from '@/db/schema';
import type { GetUsersQueryEntity } from '@/internal/entity/user_entity';

export type TransactionClient = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export interface PaginatedUsersResult {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IUserRepository {
  create(data: NewUser): Promise<User>;
  findById(id: number, tx?: TransactionClient): Promise<User | null>;
  findByEmail(email: string, tx?: TransactionClient): Promise<User | null>;
  findMany(params: GetUsersQueryEntity): Promise<PaginatedUsersResult>;
  update(
    id: number,
    data: Partial<NewUser>,
    tx?: TransactionClient,
  ): Promise<User>;
  delete(id: number): Promise<boolean>;
  updateRememberToken(id: number, tokenHash: string | null): Promise<void>;
  findByRememberToken(tokenHash: string): Promise<User | null>;
  updateWithTransactionAndLock(
    id: number,
    mutator: (
      lockedUser: User,
      tx: TransactionClient,
    ) => Promise<Partial<NewUser>>,
  ): Promise<User>;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly interfaceName: string = 'IUserRepository') { }

  async create(data: NewUser): Promise<User> {
    const funcName = 'create';
    try {
      const [result] = await db.insert(users).values(data);
      const insertedId = Number(result.insertId);

      const createdUser = await this.findById(insertedId);
      if (!createdUser) {
        throw new InternalServerError('Failed to retrieve user after creation');
      }

      return createdUser;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        throw new ConflictError('User with this email already exists');
      }

      throw new InternalServerError(
        `[${this.interfaceName}.${funcName}] ${error.message || error}`,
      );
    }
  }

  async findById(id: number, tx?: TransactionClient): Promise<User | null> {
    const funcName = 'findById';
    try {
      const client = tx || db;
      const result = await client
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return result[0] || null;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `[${this.interfaceName}.${funcName}] ${error.message || error}`,
      );
    }
  }

  async findByEmail(
    email: string,
    tx?: TransactionClient,
  ): Promise<User | null> {
    const funcName = 'findByEmail';
    try {
      const client = tx || db;
      const result = await client
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);
      return result[0] || null;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `[${this.interfaceName}.${funcName}] ${error.message || error}`,
      );
    }
  }

  async findMany(params: GetUsersQueryEntity): Promise<PaginatedUsersResult> {
    const funcName = 'findMany';

    try {
      const page = Math.max(1, params.page || 1);
      const limit = Math.max(1, Math.min(100, params.limit || 10));
      const offset = (page - 1) * limit;

      const whereClause = params.search
        ? or(
          like(users.name, `%${params.search}%`),
          like(users.email, `%${params.search}%`),
        )
        : undefined;

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause);

      const total = Number(totalResult[0]?.count || 0);

      const data = await db
        .select()
        .from(users)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(sql`${users.id} DESC`);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `[${this.interfaceName}.${funcName}] ${error.message || error}`,
      );
    }
  }

  async update(
    id: number,
    data: Partial<NewUser>,
    tx?: TransactionClient,
  ): Promise<User> {
    const funcName = 'update';
    try {
      const client = tx || db;
      await client.update(users).set(data).where(eq(users.id, id));
      const updatedUser = await this.findById(id, tx);

      if (!updatedUser) {
        throw new InternalServerError(
          `[${this.interfaceName}.${funcName}] Failed to retrieve user after update`,
        );
      }

      return updatedUser;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        throw new ConflictError('User with this email already exists');
      }

      throw new InternalServerError(
        `[${this.interfaceName}.${funcName}] ${error.message || error}`,
      );
    }
  }

  async delete(id: number): Promise<boolean> {
    const funcName = 'delete';
    try {
      const [result] = await db.delete(users).where(eq(users.id, id));
      return result.affectedRows > 0;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `[${this.interfaceName}.${funcName}] ${error.message || error}`,
      );
    }
  }

  async updateRememberToken(
    id: number,
    tokenHash: string | null,
  ): Promise<void> {
    const funcName = 'updateRememberToken';
    try {
      await db
        .update(users)
        .set({ rememberToken: tokenHash })
        .where(eq(users.id, id));
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `[${this.interfaceName}.${funcName}] ${error.message || error}`,
      );
    }
  }

  async findByRememberToken(tokenHash: string): Promise<User | null> {
    const funcName = 'findByRememberToken';
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.rememberToken, tokenHash))
        .limit(1);
      return result[0] || null;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError(
        `[${this.interfaceName}.${funcName}] ${error.message || error}`,
      );
    }
  }

  async updateWithTransactionAndLock(
    id: number,
    mutator: (
      lockedUser: User,
      tx: TransactionClient,
    ) => Promise<Partial<NewUser>>,
  ): Promise<User> {
    const funcName = 'updateWithTransactionAndLock';
    try {
      return await db.transaction(async (tx) => {
        // 1. Pessimistic lock row with SELECT ... FOR UPDATE
        const [lockedUser] = await tx
          .select()
          .from(users)
          .where(eq(users.id, id))
          .for('update');

        if (!lockedUser) {
          throw new NotFoundError(`User with ID ${id} was not found`);
        }

        // 2. Execute mutation logic within the transaction
        const updateData = await mutator(lockedUser, tx);

        // 3. Apply updates if any fields were modified
        if (Object.keys(updateData).length > 0) {
          await tx.update(users).set(updateData).where(eq(users.id, id));
        }

        // 4. Retrieve updated user within the same transaction
        const [updatedUser] = await tx
          .select()
          .from(users)
          .where(eq(users.id, id));

        return updatedUser || lockedUser;
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        throw new ConflictError('User with this email already exists');
      }

      throw new InternalServerError(
        `[${this.interfaceName}.${funcName}] ${error.message || error}`,
      );
    }
  }
}
