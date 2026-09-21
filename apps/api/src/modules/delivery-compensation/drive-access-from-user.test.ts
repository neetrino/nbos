import { describe, expect, it } from 'vitest';
import { driveAccessFromUser } from './drive-access-from-user';

describe('driveAccessFromUser', () => {
  it('uses DRIVE_VIEW scope and does not default to ALL', () => {
    expect(
      driveAccessFromUser({
        id: 'emp-1',
        departmentIds: ['dept-1'],
        permissions: { DRIVE_VIEW: 'OWN' },
      } as never),
    ).toEqual({
      employeeId: 'emp-1',
      departmentIds: ['dept-1'],
      driveScope: 'OWN',
    });
  });
});
