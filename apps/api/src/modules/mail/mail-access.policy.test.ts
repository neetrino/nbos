import { describe, expect, it } from 'vitest';
import { mailRoleCanSend, resolveMailViewerRole } from './mail-access.policy';

describe('mailRoleCanSend', () => {
  it.each(['OWNER', 'ADMIN', 'SENDER'] as const)('allows %s', (role) => {
    expect(mailRoleCanSend(role)).toBe(true);
  });

  it('denies READER', () => {
    expect(mailRoleCanSend('READER')).toBe(false);
  });

  it('denies null role', () => {
    expect(mailRoleCanSend(null)).toBe(false);
  });
});

describe('resolveMailViewerRole', () => {
  it('returns OWNER when employee owns the mailbox', () => {
    expect(
      resolveMailViewerRole({
        ownerEmployeeId: 'emp-1',
        accessRole: 'READER',
        employeeId: 'emp-1',
        viewScope: 'OWN',
      }),
    ).toBe('OWNER');
  });

  it('returns delegated access role for non-owner', () => {
    expect(
      resolveMailViewerRole({
        ownerEmployeeId: 'owner-1',
        accessRole: 'READER',
        employeeId: 'emp-2',
        viewScope: 'OWN',
      }),
    ).toBe('READER');
  });
});
