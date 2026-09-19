import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  'migrations/20260919151000_delivery_compensation_integrity/migration.sql',
);

describe('delivery compensation integrity migration', () => {
  const sql = readFileSync(migrationPath, 'utf8');

  it('adds unique owners and allocation identity without rewriting bonus amounts', () => {
    expect(sql).toContain('delivery_configurations_product_id_key');
    expect(sql).toContain('delivery_configurations_extension_id_key');
    expect(sql).toContain('delivery_bonus_allocations_component_id_employee_id_key');
    expect(sql).toContain('delivery_configurations_product_id_key');
    expect(sql).not.toMatch(/UPDATE\s+"/i);
    expect(sql).not.toMatch(/DROP TABLE/i);
  });
});
