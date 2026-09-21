import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(root, 'migrations/20260921210000_product_platform_nullable_marketing/migration.sql'),
  'utf8',
);

describe('product platform nullable for marketing', () => {
  it('allows NULL on products without dropping the WEB default for Code inserts', () => {
    expect(sql).toContain('ALTER COLUMN "product_platform" DROP NOT NULL');
    expect(sql).not.toContain('DROP DEFAULT');
  });

  it('nulls marketing and other products, not Code', () => {
    expect(sql).toContain(`WHERE "product_category" IN ('MARKETING', 'OTHER')`);
    expect(sql).not.toMatch(/SET "product_platform" = 'WEB'/);
    expect(sql).not.toMatch(/SET "product_type"/);
  });
});
