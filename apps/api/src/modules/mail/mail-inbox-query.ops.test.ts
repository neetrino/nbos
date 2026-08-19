import { describe, expect, it, vi } from 'vitest';
import { inboxMailAccountIdsForList, listMailThreadsForViewer } from './mail-inbox-query.ops';

function mockPrismaForThreads(
  accounts: { id: string; status: string }[] = [{ id: 'acc-1', status: 'ACTIVE' }],
) {
  const emailThreadCount = vi.fn().mockResolvedValue(0);
  const emailThreadFindMany = vi.fn().mockResolvedValue([]);
  const prisma = {
    mailAccount: {
      findMany: vi.fn().mockResolvedValue(accounts),
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

  it('filters active scope by default (trashedAt null)', async () => {
    const { prisma, emailThreadFindMany } = mockPrismaForThreads();
    await listMailThreadsForViewer(prisma, 'emp-1', 'OWN', {});
    expect(emailThreadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ trashedAt: null }),
      }),
    );
  });

  it('filters trash scope (trashedAt not null)', async () => {
    const { prisma, emailThreadFindMany } = mockPrismaForThreads();
    await listMailThreadsForViewer(prisma, 'emp-1', 'OWN', { scope: 'trash' });
    expect(emailThreadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ trashedAt: { not: null } }),
        orderBy: { trashedAt: 'desc' },
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

  it('excludes DISABLED accounts from All mailboxes', async () => {
    const { prisma, emailThreadFindMany } = mockPrismaForThreads([
      { id: 'live', status: 'ACTIVE' },
      { id: 'off', status: 'DISABLED' },
    ]);
    await listMailThreadsForViewer(prisma, 'emp-1', 'OWN', {});
    expect(emailThreadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ mailAccountId: { in: ['live'] } }),
      }),
    );
  });
});

describe('inboxMailAccountIdsForList', () => {
  it('keeps an explicit DISABLED mailbox when it is the selected filter', () => {
    const scoped = inboxMailAccountIdsForList(
      [
        { id: 'live', status: 'ACTIVE' },
        { id: 'off', status: 'DISABLED' },
      ],
      'off',
    );
    expect(scoped).toEqual({ ok: true, ids: ['off'] });
  });

  it('returns not found for an unknown mailbox id', () => {
    expect(inboxMailAccountIdsForList([{ id: 'live', status: 'ACTIVE' }], 'missing')).toEqual({
      ok: false,
      error: 'mail_account_not_found',
    });
  });
});
