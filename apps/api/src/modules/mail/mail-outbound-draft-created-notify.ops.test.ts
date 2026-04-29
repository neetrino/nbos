import { describe, expect, it, vi } from 'vitest';
import { publishMailOutboundDraftCreatedNotifications } from './mail-outbound-draft-created-notify.ops';

describe('publishMailOutboundDraftCreatedNotifications', () => {
  it('creates one notification when actor is the mailbox owner', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    await publishMailOutboundDraftCreatedNotifications(
      { create },
      {
        actorEmployeeId: 'e1',
        threadId: 't1',
        messageId: 'm1',
        subject: 'Hi',
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
    await publishMailOutboundDraftCreatedNotifications(
      { create },
      {
        actorEmployeeId: 'e-admin',
        threadId: 't1',
        messageId: 'm1',
        subject: 'X',
        emailAddress: 'shared@test.com',
        ownerEmployeeId: 'e-owner',
      },
    );
    expect(create).toHaveBeenCalledTimes(2);
  });
});
