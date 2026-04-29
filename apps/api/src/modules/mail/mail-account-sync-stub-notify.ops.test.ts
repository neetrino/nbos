import { describe, expect, it, vi } from 'vitest';
import { publishMailAccountSyncStubNotifications } from './mail-account-sync-stub-notify.ops';

describe('publishMailAccountSyncStubNotifications', () => {
  it('creates one notification when actor is the owner', () => {
    const create = vi.fn();
    publishMailAccountSyncStubNotifications(
      { create },
      {
        actorEmployeeId: 'e1',
        accountId: 'a1',
        emailAddress: 'x@test.com',
        ownerEmployeeId: 'e1',
      },
    );
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'e1', entityId: 'a1' }),
    );
  });

  it('creates two notifications when owner differs from actor', () => {
    const create = vi.fn();
    publishMailAccountSyncStubNotifications(
      { create },
      {
        actorEmployeeId: 'e-admin',
        accountId: 'a1',
        emailAddress: 'shared@test.com',
        ownerEmployeeId: 'e-owner',
      },
    );
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'e-admin' }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'e-owner' }));
  });
});
