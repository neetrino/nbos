import { describe, expect, it } from 'vitest';
import {
  buildEmployeeAuthorizationContext,
  type AuthorizationRole,
} from './employee-authorization-context';

describe('employee authorization context', () => {
  it('preserves all legacy departments and unions overlapping role sources', () => {
    const legacyRole = role('legacy', 'TASKS', 'VIEW', 'DEPARTMENT');
    const additionalRole = role('head', 'TASKS', 'VIEW', 'DEPARTMENT');
    const before = buildEmployeeAuthorizationContext({
      legacyRole,
      departmentIds: ['sales', 'delivery'],
      assignments: [],
    });
    const after = buildEmployeeAuthorizationContext({
      legacyRole,
      departmentIds: ['sales', 'delivery'],
      assignments: [
        { role: additionalRole, scopeDepartmentId: 'marketing' },
        { role: additionalRole, scopeDepartmentId: 'support' },
      ],
    });
    expect(before.grants.TASKS_VIEW.departmentIds).toEqual(['sales', 'delivery']);
    expect(after.grants.TASKS_VIEW.departmentIds).toEqual([
      'sales',
      'delivery',
      'marketing',
      'support',
    ]);
    expect(after.roles).toHaveLength(2);
    const ended = buildEmployeeAuthorizationContext({
      legacyRole,
      departmentIds: ['sales', 'delivery'],
      assignments: [{ role: additionalRole, scopeDepartmentId: 'support' }],
    });
    expect(ended.grants.TASKS_VIEW.departmentIds).toEqual(['sales', 'delivery', 'support']);
  });
  it('limits a seat role department scope to its source department', () => {
    const legacyRole = role('legacy', 'TASKS', 'VIEW', 'OWN');
    const seatRole = role('sales-manager', 'CRM_DEALS', 'VIEW', 'DEPARTMENT');
    const result = buildEmployeeAuthorizationContext({
      legacyRole,
      departmentIds: ['sales', 'delivery'],
      assignments: [{ role: seatRole, scopeDepartmentId: 'sales' }],
    });

    expect(result.grants.CRM_DEALS_VIEW).toEqual({
      own: false,
      department: true,
      departmentIds: ['sales'],
      all: false,
    });
    expect(result.permissions).toMatchObject({
      TASKS_VIEW: 'OWN',
      CRM_DEALS_VIEW: 'DEPARTMENT',
    });
    expect(result.roles.map((item) => item.slug)).toEqual(['legacy', 'sales-manager']);
  });
  it('grants no departments to an additional role that lost its scope', () => {
    const legacyRole = role('legacy', 'TASKS', 'VIEW', 'OWN');
    const orphaned = role('regional-head', 'CRM_DEALS', 'VIEW', 'DEPARTMENT');
    const result = buildEmployeeAuthorizationContext({
      legacyRole,
      departmentIds: ['sales', 'delivery'],
      assignments: [{ role: orphaned, scopeDepartmentId: null }],
    });

    expect(result.grants.CRM_DEALS_VIEW.departmentIds).toEqual([]);
  });
});

function role(slug: string, module: string, action: string, scope: string): AuthorizationRole {
  return {
    id: `role-${slug}`,
    name: slug,
    slug,
    level: 4,
    permissions: [{ scope, permission: { module, action } }],
  };
}
