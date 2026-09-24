import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PRODUCT_PLATFORMS } from '@nbos/shared';

const root = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(root, 'migrations/20260921163000_product_platform/migration.sql'),
  'utf8',
);

describe('product platform migration', () => {
  it('creates WEB / APP / DESKTOP and never a MOBILE_APP platform value', () => {
    expect(sql).toContain(`CREATE TYPE "ProductPlatformEnum" AS ENUM ('WEB', 'APP', 'DESKTOP')`);
    expect(PRODUCT_PLATFORMS).toEqual(['WEB', 'APP', 'DESKTOP']);
    expect(sql).not.toMatch(/ENUM \([^)]*MOBILE_APP/s);
  });

  it('backfills legacy MOBILE_APP kinds to platform APP and leaves other products on WEB', () => {
    expect(sql).toContain(
      `ADD COLUMN "product_platform" "ProductPlatformEnum" NOT NULL DEFAULT 'WEB'`,
    );
    expect(sql).toContain(`WHERE "product_type" = 'MOBILE_APP'`);
    expect(sql).toContain(`SET "product_platform" = 'APP'`);
    expect(sql).toContain('ALTER TABLE "deals"');
  });

  it('does not rewrite product_type — the owner still sets the kind by hand', () => {
    expect(sql).not.toMatch(/SET "product_type"/);
    expect(sql).not.toMatch(/\bDROP\b/i);
  });
});
