import type { PrismaClient } from '@nbos/database';
import { listMailAccountsForViewer } from './mail-inbox-query.ops';
import type { MailAccountHealthSummaryRow } from './mail.types';

function countsByAccountId(
  rows: Iterable<{ mailAccountId: string; _count?: { _all?: number } | true }>,
): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const raw = r._count;
    const n =
      typeof raw === 'object' && raw !== null && '_all' in raw && typeof raw._all === 'number'
        ? raw._all
        : 0;
    m.set(r.mailAccountId, n);
  }
  return m;
}

/**
 * Per-mailbox thread counts and account metadata for viewers with MAIL access.
 * Uses the same mailbox scope as inbox list; no live provider probe (stub-era).
 */
export async function listMailAccountHealthSummariesForViewer(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  viewScope: string,
): Promise<MailAccountHealthSummaryRow[]> {
  const accounts = await listMailAccountsForViewer(prisma, employeeId, viewScope);
  const ids = accounts.map((a) => a.id);
  if (ids.length === 0) {
    return [];
  }

  const [totalGroups, unreadGroups, needsLinkGroups] = await prisma.$transaction([
    prisma.emailThread.groupBy({
      by: ['mailAccountId'],
      orderBy: { mailAccountId: 'asc' },
      where: { mailAccountId: { in: ids }, isSpam: false, trashedAt: null },
      _count: { _all: true },
    }),
    prisma.emailThread.groupBy({
      by: ['mailAccountId'],
      orderBy: { mailAccountId: 'asc' },
      where: { mailAccountId: { in: ids }, hasUnread: true, isSpam: false, trashedAt: null },
      _count: { _all: true },
    }),
    prisma.emailThread.groupBy({
      by: ['mailAccountId'],
      orderBy: { mailAccountId: 'asc' },
      where: {
        mailAccountId: { in: ids },
        needsBusinessLink: true,
        isSpam: false,
        trashedAt: null,
      },
      _count: { _all: true },
    }),
  ]);

  const totalMap = countsByAccountId(totalGroups);
  const unreadMap = countsByAccountId(unreadGroups);
  const needsLinkMap = countsByAccountId(needsLinkGroups);

  return accounts.map((account) => ({
    ...account,
    threadCount: totalMap.get(account.id) ?? 0,
    unreadThreadCount: unreadMap.get(account.id) ?? 0,
    needsLinkThreadCount: needsLinkMap.get(account.id) ?? 0,
  }));
}
