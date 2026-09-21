import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(root, 'migrations/20260921220000_drop_default_sale_amount/migration.sql'),
  'utf8',
);

describe('drop default sale amount migration', () => {
  it('removes the implicit 10 000 fallback column', () => {
    expect(sql).toContain('DROP COLUMN "default_sale_amount_per_unit"');
  });
});
