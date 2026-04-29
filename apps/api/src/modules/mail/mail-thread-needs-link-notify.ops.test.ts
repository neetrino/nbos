import { describe, expect, it, vi } from 'vitest';
import { publishMailThreadNeedsLinkChangedNotifications } from './mail-thread-needs-link-notify.ops';

describe('publishMailThreadNeedsLinkChangedNotifications', () => {
  it('creates one notification when actor is the mailbox owner (flagged)', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    await publishMailThreadNeedsLinkChangedNotifications(
      { create },
      {
        actorEmployeeId: 'e1',
        threadId: 't1',
        to: true,
        subjectNormalized: 'hello',
        emailAddress: 'box@test.com',
        ownerEmployeeId: 'e1',
      },
    );
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'e1',
        entityId: 't1',
        link: '/mail/threads/t1',
      }),
    );
  });

  it('creates two notifications when owner differs from actor (cleared)', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    await publishMailThreadNeedsLinkChangedNotifications(
      { create },
      {
        actorEmployeeId: 'e-admin',
        threadId: 't1',
        to: false,
        subjectNormalized: 'x',
        emailAddress: 'shared@test.com',
        ownerEmployeeId: 'e-owner',
      },
    );
    expect(create).toHaveBeenCalledTimes(2);
  });
});
