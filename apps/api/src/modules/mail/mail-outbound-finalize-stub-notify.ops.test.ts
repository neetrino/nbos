import { describe, expect, it, vi } from 'vitest';
import { publishMailOutboundSendStubFailedNotifications } from './mail-outbound-finalize-stub-notify.ops';

describe('publishMailOutboundSendStubFailedNotifications', () => {
  it('creates one notification when actor is the mailbox owner', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    await publishMailOutboundSendStubFailedNotifications(
      { create },
      {
        actorEmployeeId: 'e1',
        threadId: 't1',
        messageId: 'm1',
        subject: 'Hello',
        emailAddress: 'box@test.com',
        ownerEmployeeId: 'e1',
      },
    );
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'e1',
        entityId: 'm1',
        link: '/mail/threads/t1',
      }),
    );
  });

  it('creates two notifications when owner differs from actor', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    await publishMailOutboundSendStubFailedNotifications(
      { create },
      {
        actorEmployeeId: 'e-admin',
        threadId: 't1',
        messageId: 'm1',
        subject: 'Report',
        emailAddress: 'shared@test.com',
        ownerEmployeeId: 'e-owner',
      },
    );
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'e-admin' }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'e-owner' }));
  });
});
