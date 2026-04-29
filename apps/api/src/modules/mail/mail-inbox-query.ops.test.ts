import { describe, expect, it, vi } from 'vitest';
import { listMailThreadsForViewer } from './mail-inbox-query.ops';

function mockPrismaForThreads() {
  const emailThreadCount = vi.fn().mockResolvedValue(0);
  const emailThreadFindMany = vi.fn().mockResolvedValue([]);
  const prisma = {
    mailAccount: {
      findMany: vi.fn().mockResolvedValue([{ id: 'acc-1' }]),
    },
    emailThread: { count: emailThreadCount, findMany: emailThreadFindMany },
    $transaction: (ops: unknown[]) => Promise.all(ops as [Promise<unknown>, Promise<unknown>]),
  } as never;
  return { prisma, emailThreadCount, emailThreadFindMany };
}

describe('listMailThreadsForViewer', () => {
  it('includes needsBusinessLink when needsLinkOnly is true', async () => {
    const { prisma, emailThreadFindMany } = mockPrismaForThreads();
    const result = await listMailThreadsForViewer(prisma, 'emp-1', 'OWN', { needsLinkOnly: true });
    expect(emailThreadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ needsBusinessLink: true }),
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.meta.totalCount).toBe(0);
    }
  });

  it('includes hasUnread when unreadOnly is true', async () => {
    const { prisma, emailThreadFindMany } = mockPrismaForThreads();
    await listMailThreadsForViewer(prisma, 'emp-1', 'OWN', { unreadOnly: true });
    expect(emailThreadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ hasUnread: true }),
      }),
    );
  });

  it('passes skip and take from pagination', async () => {
    const { prisma, emailThreadFindMany } = mockPrismaForThreads();
    await listMailThreadsForViewer(prisma, 'emp-1', 'OWN', { page: 2, pageSize: 10 });
    expect(emailThreadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });
});
