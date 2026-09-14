import { describe, expect, it } from 'vitest';
import {
  buildEffectivePermissionContext,
  permissionKey,
  toPermissionScope,
} from './effective-permissions';

describe('effective permissions', () => {
  it('combines own and role-specific department grants without losing provenance', () => {
    const key = permissionKey('CRM_LEADS', 'VIEW');
    const result = buildEffectivePermissionContext([
      { key, scope: 'OWN', departmentIds: [] },
      { key, scope: 'DEPARTMENT', departmentIds: ['sales'] },
      { key, scope: 'DEPARTMENT', departmentIds: ['marketing'] },
    ]);

    expect(result.permissions[key]).toBe('DEPARTMENT');
    expect(result.grants[key]).toEqual({
      own: true,
      department: true,
      departmentIds: ['sales', 'marketing'],
      all: false,
    });
  });

  it('lets ALL dominate the compatibility projection while retaining details', () => {
    const key = permissionKey('TASKS', 'VIEW');
    const result = buildEffectivePermissionContext([
      { key, scope: 'OWN', departmentIds: [] },
      { key, scope: 'ALL', departmentIds: [] },
    ]);

    expect(result.permissions[key]).toBe('ALL');
    expect(result.grants[key]?.all).toBe(true);
    expect(result.grants[key]?.own).toBe(true);
  });

  it('fails closed for unknown persisted scopes', () => {
    expect(toPermissionScope('INVALID')).toBe('NONE');
    expect(
      buildEffectivePermissionContext([
        { key: permissionKey('FINANCE', 'VIEW'), scope: 'INVALID', departmentIds: [] },
      ]),
    ).toEqual({ permissions: {}, grants: {} });
  });
});
