import { config } from 'dotenv';
import path from 'node:path';
import { assertDevDatabaseUrl } from './assert-dev-database';

/** Loads `.env.local` and refuses any host that is not the agreed development branch. */
export function loadDevDeliveryEnv(): void {
  config({ path: path.resolve(__dirname, '../../.env.local') });
  assertDevDatabaseUrl(process.env.DATABASE_URL, 'DATABASE_URL');
  if (process.env.DIRECT_URL) {
    assertDevDatabaseUrl(process.env.DIRECT_URL, 'DIRECT_URL');
  }
}
