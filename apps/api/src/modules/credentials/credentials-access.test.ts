import { describe, it, expect } from 'vitest';
import {
  credentialsAccessFromUser,
  credentialsRbacBypassesRowFilter,
  resolveCredentialsRbacScope,
} from './credentials-access';

describe('credentialsRbacBypassesRowFilter', () => {
  it('returns true for ALL scope', () => {
    expect(credentialsRbacBypassesRowFilter('ALL')).toBe(true);
    expect(credentialsRbacBypassesRowFilter(' all ')).toBe(true);
  });

  it('returns false for other scopes', () => {
    expect(credentialsRbacBypassesRowFilter('OWN')).toBe(false);
    expect(credentialsRbacBypassesRowFilter('DEPARTMENT')).toBe(false);
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
  };

  it('picks scope by action', () => {
    expect(resolveCredentialsRbacScope(access, 'view')).toBe('OWN');
    expect(resolveCredentialsRbacScope(access, 'edit')).toBe('ALL');
    expect(resolveCredentialsRbacScope(access, 'delete')).toBe('NONE');
  });
});

describe('credentialsAccessFromUser', () => {
  it('maps employee id and CREDENTIALS scopes from permissions', () => {
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
    });
  });
});
