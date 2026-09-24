import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    'migrations/20260921240000_price_one_published_per_tier/migration.sql',
  ),
  'utf8',
);

describe('price one published per tier migration', () => {
  it('replaces the function-wide published unique with card and gradation indexes', () => {
    expect(sql).toContain('DROP INDEX IF EXISTS "delivery_function_price_versions_one_published"');
    expect(sql).toContain('delivery_function_price_versions_one_published_card');
    expect(sql).toContain('delivery_function_price_versions_one_published_tier');
    expect(sql).toContain('AND "tier_id" IS NULL');
    expect(sql).toContain('AND "tier_id" IS NOT NULL');
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
  });
});
