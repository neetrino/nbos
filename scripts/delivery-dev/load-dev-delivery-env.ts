import { config } from 'dotenv';
import path from 'node:path';
import { assertDevDatabaseUrl } from './assert-dev-database';

const PROD_FLAG = '--prod';
const PROD_HOST_TOKEN = 'sweet-dew';

/** Loads `.env.local` and refuses any host that is not the agreed development branch. */
export function loadDevDeliveryEnv(): void {
  config({ path: path.resolve(__dirname, '../../.env.local') });
  assertDevDatabaseUrl(process.env.DATABASE_URL, 'DATABASE_URL');
  if (process.env.DIRECT_URL) {
    assertDevDatabaseUrl(process.env.DIRECT_URL, 'DIRECT_URL');
  }
}

/**
 * Same as the dev loader, unless `--prod` is present. Then both URLs become
 * `DIRECT_URL_PROD`, and the host must be the production branch.
 */
export function loadDeliveryEnv(argv: readonly string[] = process.argv): void {
  config({ path: path.resolve(__dirname, '../../.env.local') });
  if (!argv.includes(PROD_FLAG)) {
    loadDevDeliveryEnv();
    return;
  }
  const url = process.env.DIRECT_URL_PROD?.trim();
  if (!url) throw new Error('Set DIRECT_URL_PROD in .env.local. Refusing --prod.');
  const host = new URL(url).hostname;
  if (!host.includes(PROD_HOST_TOKEN)) {
    throw new Error(`--prod host is ${host}, expected ${PROD_HOST_TOKEN}.`);
  }
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = url;
}
