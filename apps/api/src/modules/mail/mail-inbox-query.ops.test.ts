import { describe, expect, it, vi } from 'vitest';
import { listMailThreadsForViewer } from './mail-inbox-query.ops';

describe('listMailThreadsForViewer', () => {
  it('includes needsBusinessLink when needsLinkOnly is true', async () => {
    const emailThreadFindMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      mailAccount: {
        findMany: vi.fn().mockResolvedValue([{ id: 'acc-1' }]),
      },
      emailThread: { findMany: emailThreadFindMany },
    } as never;
    await listMailThreadsForViewer(prisma, 'emp-1', 'OWN', { needsLinkOnly: true });
    expect(emailThreadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ needsBusinessLink: true }),
      }),
    );
  });

  it('includes hasUnread when unreadOnly is true', async () => {
    const emailThreadFindMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      mailAccount: {
        findMany: vi.fn().mockResolvedValue([{ id: 'acc-1' }]),
      },
      emailThread: { findMany: emailThreadFindMany },
    } as never;
    await listMailThreadsForViewer(prisma, 'emp-1', 'OWN', { unreadOnly: true });
    expect(emailThreadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ hasUnread: true }),
      }),
    );
  });
});
