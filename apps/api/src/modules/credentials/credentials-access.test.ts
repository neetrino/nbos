import { describe, it, expect } from 'vitest';
import {
  credentialsAccessFromUser,
  credentialsRbacBypassesRowFilter,
  hasCredentialsRowVisibilityBypass,
  resolveCredentialsRbacScope,
} from './credentials-access';

describe('credentialsRbacBypassesRowFilter', () => {
  it('returns true only when bypassRowVisibility is set', () => {
    expect(credentialsRbacBypassesRowFilter(true)).toBe(true);
    expect(credentialsRbacBypassesRowFilter({ bypassRowVisibility: true })).toBe(true);
    expect(credentialsRbacBypassesRowFilter({ bypassRowVisibility: false })).toBe(false);
    expect(credentialsRbacBypassesRowFilter(false)).toBe(false);
    expect(credentialsRbacBypassesRowFilter(undefined)).toBe(false);
  });
});

describe('hasCredentialsRowVisibilityBypass', () => {
  it('requires non-NONE CREDENTIALS_BYPASS_ROW_VISIBILITY', () => {
    expect(hasCredentialsRowVisibilityBypass({ CREDENTIALS_BYPASS_ROW_VISIBILITY: 'ALL' })).toBe(
      true,
    );
    expect(hasCredentialsRowVisibilityBypass({ CREDENTIALS_BYPASS_ROW_VISIBILITY: 'OWN' })).toBe(
      true,
    );
    expect(hasCredentialsRowVisibilityBypass({ CREDENTIALS_BYPASS_ROW_VISIBILITY: 'NONE' })).toBe(
      false,
    );
    expect(hasCredentialsRowVisibilityBypass({ CREDENTIALS_VIEW: 'ALL' })).toBe(false);
    expect(hasCredentialsRowVisibilityBypass({})).toBe(false);
  });
});

describe('resolveCredentialsRbacScope', () => {
  const access = {
    employeeId: 'e1',
    departmentIds: [],
    viewScope: 'OWN',
    editScope: 'ALL',
    deleteScope: 'NONE',
    bypassRowVisibility: false,
  };

  it('picks scope by action', () => {
    expect(resolveCredentialsRbacScope(access, 'view')).toBe('OWN');
    expect(resolveCredentialsRbacScope(access, 'edit')).toBe('ALL');
    expect(resolveCredentialsRbacScope(access, 'delete')).toBe('NONE');
  });
});

describe('credentialsAccessFromUser', () => {
  it('maps scopes and does not treat CREDENTIALS_VIEW=ALL as bypass', () => {
    const ctx = credentialsAccessFromUser({
      id: 'emp-1',
      email: 'o@example.com',
      role: 'role-owner',
      roleLevel: 100,
      departmentIds: ['dept-1'],
      firstName: 'Owner',
      lastName: 'User',
      permissions: {
        CREDENTIALS_VIEW: 'ALL',
        CREDENTIALS_EDIT: 'ALL',
        CREDENTIALS_DELETE: 'ALL',
      },
    });

    expect(ctx).toEqual({
      employeeId: 'emp-1',
      departmentIds: ['dept-1'],
      viewScope: 'ALL',
      editScope: 'ALL',
      deleteScope: 'ALL',
      bypassRowVisibility: false,
    });
  });

  it('enables bypass only from CREDENTIALS_BYPASS_ROW_VISIBILITY', () => {
    const ctx = credentialsAccessFromUser({
      id: 'emp-1',
      email: 'o@example.com',
      role: 'role-owner',
      roleLevel: 100,
      departmentIds: [],
      firstName: 'Owner',
      lastName: 'User',
      permissions: {
        CREDENTIALS_VIEW: 'OWN',
        CREDENTIALS_BYPASS_ROW_VISIBILITY: 'ALL',
      },
    });

    expect(ctx.bypassRowVisibility).toBe(true);
    expect(credentialsRbacBypassesRowFilter(ctx)).toBe(true);
  });
});
