import { describe, expect, it, vi } from 'vitest';
import { publishMailOutboundCancelledNotifications } from './mail-outbound-cancel-notify.ops';

describe('publishMailOutboundCancelledNotifications', () => {
  it('creates one notification when actor is the mailbox owner', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    await publishMailOutboundCancelledNotifications(
      { create },
      {
        actorEmployeeId: 'e1',
        threadId: 't1',
        messageId: 'm1',
        subject: 'Hi',
        emailAddress: 'box@test.com',
        ownerEmployeeId: 'e1',
        previousDeliveryStatus: 'DRAFT',
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
    await publishMailOutboundCancelledNotifications(
      { create },
      {
        actorEmployeeId: 'e-admin',
        threadId: 't1',
        messageId: 'm1',
        subject: 'X',
        emailAddress: 'shared@test.com',
        ownerEmployeeId: 'e-owner',
        previousDeliveryStatus: 'QUEUED',
      },
    );
    expect(create).toHaveBeenCalledTimes(2);
  });
});
