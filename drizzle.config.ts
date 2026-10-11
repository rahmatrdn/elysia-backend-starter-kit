import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'mysql://root:password@localhost:3306/elysia_db',
  },
});
