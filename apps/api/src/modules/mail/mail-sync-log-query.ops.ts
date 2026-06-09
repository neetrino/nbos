import type { PrismaClient } from '@nbos/database';
import type { MailSyncLogRow } from './mail.types';

const MAIL_SYNC_LOG_PAGE_SIZE = 50;

export async function listMailSyncLogs(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
): Promise<MailSyncLogRow[]> {
  const rows = await prisma.mailSyncLog.findMany({
    where: { mailAccountId },
    orderBy: { createdAt: 'desc' },
    take: MAIL_SYNC_LOG_PAGE_SIZE,
  });
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
  }));
}
