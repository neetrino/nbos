import { config } from 'dotenv';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

config({ path: path.resolve(__dirname, '../../.env.local') });

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: env('DIRECT_URL'),
  },
  migrations: {
    path: path.join(__dirname, 'prisma', 'migrations'),
  },
});
