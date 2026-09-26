import { describe, expect, it } from 'vitest';
import { groupRolePermissionModules } from './role-permission-groups';
import { buildRoleMatrixScopes } from './role-permissions-types';

describe('buildRoleMatrixScopes', () => {
  it('fills missing catalog actions with NONE', () => {
    const scopes = buildRoleMatrixScopes(
      [
        {
          id: 'rp-1',
          permissionId: 'perm-clients-view',
          scope: 'ALL',
          permission: { id: 'perm-clients-view', module: 'CLIENTS', action: 'VIEW' },
        },
      ],
      [
        { id: 'perm-clients-view', module: 'CLIENTS', action: 'VIEW' },
        { id: 'perm-clients-add', module: 'CLIENTS', action: 'ADD' },
      ],
    );
    expect(scopes['CLIENTS:VIEW']).toBe('ALL');
    expect(scopes['CLIENTS:ADD']).toBe('NONE');
  });
});

describe('groupRolePermissionModules', () => {
  it('keeps known modules in their group and filters by search', () => {
    const groups = groupRolePermissionModules(
      ['CLIENTS', 'FINANCE_SALARY', 'UNKNOWN_MODULE'],
      'salary',
    );
    expect(groups).toEqual([{ id: 'finance', title: 'Finance', modules: ['FINANCE_SALARY'] }]);
  });

  it('omits the legacy call-recordings module', () => {
    const groups = groupRolePermissionModules(['CRM_LEADS', 'CALLS', 'CRM_CALL_RECORDINGS'], '');
    expect(groups.flatMap((group) => group.modules)).toEqual(['CRM_LEADS', 'CALLS']);
  });
});
