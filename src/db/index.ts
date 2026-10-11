import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

console.log(process.env.DATABASE_URL);

const pool = mysql.createPool(
  process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/elysia_db',
);

export const db = drizzle(pool, { schema, mode: 'default' });
export * from './schema';
