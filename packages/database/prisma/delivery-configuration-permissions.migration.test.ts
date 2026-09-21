import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DELIVERY_CONFIGURATION_EDIT_DEFAULT_ROLE_IDS,
  DELIVERY_CONFIGURATION_READ_ALL_DEFAULT_ROLE_IDS,
  DELIVERY_CONFIGURATION_READ_OWN_DEFAULT_ROLE_IDS,
} from '@nbos/shared';

const root = dirname(fileURLToPath(import.meta.url));

const EDIT_ONLY_ROLES = DELIVERY_CONFIGURATION_EDIT_DEFAULT_ROLE_IDS.filter(
  (roleId) => roleId !== 'role-owner' && roleId !== 'role-ceo',
);

describe('delivery configuration permission migration', () => {
  const sql = readFileSync(
    join(root, 'migrations/20260921140000_delivery_configuration_permissions/migration.sql'),
    'utf8',
  );

  it('creates all four actions so the Settings matrix row looks like every other module', () => {
    for (const action of ['VIEW', 'EDIT', 'ADD', 'DELETE']) {
      expect(sql).toContain(`'DELIVERY_CONFIGURATION', '${action}'`);
    }
  });

  it('never overwrites a scope an administrator already tuned', () => {
    expect(sql).toContain('ON CONFLICT ("module", "action") DO NOTHING');
    expect(sql).toContain('ON CONFLICT ("role_id", "permission_id") DO NOTHING');
    expect(sql).not.toMatch(/DO UPDATE/i);
    expect(sql).not.toMatch(/\bDELETE FROM\b/i);
  });

  it('grants edit to the configurator roles and to nobody else', () => {
    for (const roleId of EDIT_ONLY_ROLES) {
      expect(sql).toContain(roleId);
    }
    const editStatement = sql.slice(sql.indexOf("p.\"action\" IN ('VIEW', 'EDIT', 'ADD')"));
    const editRoles = editStatement.slice(0, editStatement.indexOf('ON CONFLICT'));
    for (const roleId of DELIVERY_CONFIGURATION_READ_ALL_DEFAULT_ROLE_IDS) {
      expect(editRoles).not.toContain(roleId);
    }
    for (const roleId of DELIVERY_CONFIGURATION_READ_OWN_DEFAULT_ROLE_IDS) {
      expect(editRoles).not.toContain(roleId);
    }
  });

  it('leaves delivery specialists able to read their own cards and nothing wider', () => {
    const ownStatement = sql.slice(sql.lastIndexOf("'OWN'"));
    for (const roleId of DELIVERY_CONFIGURATION_READ_OWN_DEFAULT_ROLE_IDS) {
      expect(ownStatement).toContain(roleId);
    }
    expect(ownStatement).toContain('p."action" = \'VIEW\'');
    expect(ownStatement).not.toContain("'EDIT'");
  });

  /**
   * The slug branch is the fallback for a database whose role ids are not the canonical `role-*`
   * strings, so it is worthless if it repeats the id spelling: `roles.slug` carries the bare name.
   */
  it('matches roles by id and by slug, spelling each the way its own column does', () => {
    expect(sql).toMatch(/r\."id" IN/);
    expect(sql).toMatch(/r\."slug" IN/);
    expect(sql).not.toMatch(/r\."slug" IN \([^)]*'role-/s);

    const reference = readFileSync(
      join(root, 'migrations/20260919123000_delivery_compensation_permissions/migration.sql'),
      'utf8',
    );
    for (const slug of ['owner', 'ceo', 'pm', 'head-delivery']) {
      expect(reference).toContain(`'${slug}'`);
      expect(sql).toContain(`'${slug}'`);
    }
  });
});
