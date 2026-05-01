import { describe, expect, it, vi } from 'vitest';
import { publishMailOutboundFailedResetToDraftNotifications } from './mail-outbound-reset-failed-notify.ops';

describe('publishMailOutboundFailedResetToDraftNotifications', () => {
  it('creates one notification when actor is the mailbox owner', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    await publishMailOutboundFailedResetToDraftNotifications(
      { create },
      {
        actorEmployeeId: 'e1',
        threadId: 't1',
        messageId: 'm1',
        subject: 'Invoice',
        emailAddress: 'box@test.com',
        ownerEmployeeId: 'e1',
      },
    );
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'e1', link: '/mail/threads/t1' }),
    );
  });

  it('creates two notifications when owner differs from actor', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    await publishMailOutboundFailedResetToDraftNotifications(
      { create },
      {
        actorEmployeeId: 'e-admin',
        threadId: 't1',
        messageId: 'm1',
        subject: 'Y',
        emailAddress: 'shared@test.com',
        ownerEmployeeId: 'e-owner',
      },
    );
    expect(create).toHaveBeenCalledTimes(2);
  });
});
