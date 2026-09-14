import { describe, expect, it } from 'vitest';
import type { CurrentUserPayload } from '../decorators';
import { permissionDepartmentIds } from './permission-department-scope';

describe('permission department scope', () => {
  it('uses only departments contributed to the requested permission', () => {
    const user = userFixture();
    expect(permissionDepartmentIds(user, 'CRM_DEALS_VIEW')).toEqual(['sales']);
  });
});

function userFixture(): CurrentUserPayload {
  return {
    id: 'employee-1',
    email: 'employee@example.com',
    role: 'member',
    roleLevel: 5,
    departmentIds: ['sales', 'delivery', 'finance'],
    firstName: 'Test',
    lastName: 'Employee',
    permissions: { CRM_DEALS_VIEW: 'DEPARTMENT', TASKS_VIEW: 'DEPARTMENT' },
    permissionGrants: {
      CRM_DEALS_VIEW: {
        own: false,
        department: true,
        departmentIds: ['sales'],
        all: false,
      },
      TASKS_VIEW: {
        own: false,
        department: true,
        departmentIds: ['delivery'],
        all: false,
      },
    },
  };
}
