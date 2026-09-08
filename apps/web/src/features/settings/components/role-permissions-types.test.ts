import { describe, expect, it } from 'vitest';
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
