import type { PrismaClient } from '@nbos/database';
import { resolveMailIdleStatus, resolveMailWatchStatus } from './mail-health-watch';
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
  gmailWatchConfigured: boolean,
): Promise<MailAccountHealthSummaryRow[]> {
  const accounts = await listMailAccountsForViewer(prisma, employeeId, viewScope);
  const ids = accounts.map((a) => a.id);
  if (ids.length === 0) {
    return [];
  }

  const [totalGroups, unreadGroups, needsLinkGroups, connections] = await prisma.$transaction([
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
    prisma.mailProviderConnection.findMany({
      where: { mailAccountId: { in: ids } },
      select: {
        mailAccountId: true,
        providerType: true,
        gmailWatchExpiresAt: true,
        imapIdleHeartbeatAt: true,
      },
    }),
  ]);

  const totalMap = countsByAccountId(totalGroups);
  const unreadMap = countsByAccountId(unreadGroups);
  const needsLinkMap = countsByAccountId(needsLinkGroups);

  const connectionByAccount = new Map(connections.map((row) => [row.mailAccountId, row]));
  const now = new Date();

  return accounts.map((account) => {
    const connection = connectionByAccount.get(account.id);
    const watchExpiresAt = connection?.gmailWatchExpiresAt ?? null;
    const idleHeartbeatAt = connection?.imapIdleHeartbeatAt ?? null;
    return {
      ...account,
      threadCount: totalMap.get(account.id) ?? 0,
      unreadThreadCount: unreadMap.get(account.id) ?? 0,
      needsLinkThreadCount: needsLinkMap.get(account.id) ?? 0,
      watch: resolveMailWatchStatus({
        providerType: connection?.providerType ?? account.providerType,
        gmailWatchConfigured,
        watchExpiresAt,
        now,
      }),
      watchExpiresAt: watchExpiresAt?.toISOString() ?? null,
      idle: resolveMailIdleStatus(idleHeartbeatAt, now),
      idleHeartbeatAt: idleHeartbeatAt?.toISOString() ?? null,
    };
  });
}
