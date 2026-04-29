import type { PrismaClient } from '@nbos/database';
import { fetchMailThreadMessageForEdit } from './mail-thread-message-access.ops';
import type { MailDeliveryLogRow } from './mail.types';

function toDeliveryLogRow(row: {
  id: string;
  kind: string;
  detail: string | null;
  actorEmployeeId: string;
  createdAt: Date;
}): MailDeliveryLogRow {
  return {
    id: row.id,
    kind: row.kind,
    detail: row.detail,
    actorEmployeeId: row.actorEmployeeId,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Lists delivery pipeline events for one message after mailbox/thread access check.
 */
export async function listMailDeliveryLogsForMessage(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    employeeId: string;
    viewScope: string;
    threadId: string;
    messageId: string;
  },
): Promise<MailDeliveryLogRow[] | null> {
  const access = await fetchMailThreadMessageForEdit(prisma, {
    threadId: params.threadId,
    messageId: params.messageId,
    employeeId: params.employeeId,
    accessScope: params.viewScope,
  });
  if (access.status === 'no_mailbox' || access.status === 'no_message') {
    return null;
  }
  const rows = await prisma.mailDeliveryLog.findMany({
    where: { emailMessageId: params.messageId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return rows.map(toDeliveryLogRow);
}
