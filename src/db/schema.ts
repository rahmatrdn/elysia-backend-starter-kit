import {
  bigint,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  // Unique user identifier (primary key)
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),

  // Full name of the user
  name: varchar('name', { length: 255 }).notNull(),

  // Unique email address used for authentication
  email: varchar('email', { length: 255 }).notNull().unique(),

  // Timestamp when the user email was verified
  emailVerifiedAt: timestamp('email_verified_at'),

  // Hashed password for authentication
  password: varchar('password', { length: 255 }).notNull(),

  // Token for remember-me session persistent authentication
  rememberToken: varchar('remember_token', { length: 100 }),

  // Access role level (1: Super Admin, 2: Admin, 3: User)
  roleAccess: int('role_access').notNull().default(3),

  // Record creation timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),

  // Record last update timestamp
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
