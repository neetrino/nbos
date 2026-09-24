import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CODE_SITE_PRODUCT_TYPES, WORDPRESS_PRODUCT_TYPES } from '@nbos/shared';

const root = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(root, 'migrations/20260924120000_site_product_kinds/migration.sql'),
  'utf8',
);

const NEW_SITE_KINDS = [
  'REAL_ESTATE_WEBSITE',
  'SERVICE_WEBSITE',
  'TRAVEL_WEBSITE',
  'CLASSIFIEDS_PORTAL',
  'JOB_BOARD',
] as const;

describe('new site product kinds migration', () => {
  it('adds every new enum and active picker option without removing existing kinds', () => {
    for (const kind of NEW_SITE_KINDS) {
      expect(sql).toContain(`ADD VALUE IF NOT EXISTS '${kind}'`);
      expect(sql).toContain(`('${kind}',`);
      expect(CODE_SITE_PRODUCT_TYPES).toContain(kind);
    }
    expect(sql).toContain('ON CONFLICT ("list_key", "code") DO NOTHING');
    expect(sql).not.toMatch(/\bDROP\b/i);
    expect(WORDPRESS_PRODUCT_TYPES).toEqual(
      expect.arrayContaining(['REAL_ESTATE_WEBSITE', 'SERVICE_WEBSITE', 'TRAVEL_WEBSITE']),
    );
    expect(WORDPRESS_PRODUCT_TYPES).not.toContain('CLASSIFIEDS_PORTAL');
    expect(WORDPRESS_PRODUCT_TYPES).not.toContain('JOB_BOARD');
  });
});
