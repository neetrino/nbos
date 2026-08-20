import { describe, it, expect } from 'vitest';
import {
  credentialsAccessFromUser,
  credentialsRbacBypassesRowFilter,
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

describe('resolveCredentialsRbacScope', () => {
  const access = {
    employeeId: 'e1',
    departmentIds: [],
    viewScope: 'OWN',
    editScope: 'ALL',
    deleteScope: 'NONE',
    bypassRowVisibility: false,
    executiveProjectAccess: false,
  };

  it('picks scope by action', () => {
    expect(resolveCredentialsRbacScope(access, 'view')).toBe('OWN');
    expect(resolveCredentialsRbacScope(access, 'edit')).toBe('ALL');
    expect(resolveCredentialsRbacScope(access, 'delete')).toBe('NONE');
  });
});

describe('credentialsAccessFromUser', () => {
  it('does not treat CREDENTIALS_VIEW=ALL or bypass permission as god-mode', () => {
    const ctx = credentialsAccessFromUser({
      id: 'emp-1',
      email: 'o@example.com',
      role: 'owner',
      roleLevel: 1,
      departmentIds: ['dept-1'],
      firstName: 'Owner',
      lastName: 'User',
      permissions: {
        CREDENTIALS_VIEW: 'ALL',
        CREDENTIALS_EDIT: 'ALL',
        CREDENTIALS_DELETE: 'ALL',
        CREDENTIALS_BYPASS_ROW_VISIBILITY: 'ALL',
      },
    });
    expect(ctx.bypassRowVisibility).toBe(false);
    expect(ctx.executiveProjectAccess).toBe(false);
  });

  it('enables bypass only for Platform Owner identity', () => {
    const ctx = credentialsAccessFromUser({
      id: 'emp-1',
      email: 'o@example.com',
      role: 'pm',
      roleLevel: 10,
      departmentIds: [],
      firstName: 'Sipan',
      lastName: 'Babajanyan',
      isPlatformOwner: true,
      permissions: { CREDENTIALS_VIEW: 'OWN' },
    });
    expect(ctx.bypassRowVisibility).toBe(true);
    expect(ctx.executiveProjectAccess).toBe(false);
  });

  it('gives CEO operational project access without vault bypass', () => {
    const ctx = credentialsAccessFromUser({
      id: 'ceo-1',
      email: 'ceo@example.com',
      role: 'ceo',
      roleLevel: 2,
      departmentIds: [],
      firstName: 'CEO',
      lastName: 'User',
      isPlatformOwner: false,
      permissions: { CREDENTIALS_VIEW: 'ALL' },
    });
    expect(ctx.bypassRowVisibility).toBe(false);
    expect(ctx.executiveProjectAccess).toBe(true);
  });
});
