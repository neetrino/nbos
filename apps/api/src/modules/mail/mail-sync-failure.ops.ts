import { MailSyncLogKind, PrismaClient } from '@nbos/database';
import { classifyMailProviderError } from './mail-provider-error.classify';
import { markMailboxNeedsReconnect } from './mail-send-outcome.ops';

export type MailSyncFailureOutcome = 'complete' | 'retry';

/**
 * Auth → NEEDS_RECONNECT and complete the job.
 * Transient / other → DEGRADED and retry (caller throws).
 */
export async function applyMailSyncFailure(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
  error: unknown,
): Promise<MailSyncFailureOutcome> {
  const errorClass = classifyMailProviderError(error);
  const detail = error instanceof Error ? error.message : 'unknown error';
  if (errorClass === 'auth') {
    await markMailboxNeedsReconnect(prisma, mailAccountId, detail);
    await prisma.mailSyncLog.create({
      data: { mailAccountId, kind: MailSyncLogKind.RECONNECT_REQUIRED, detail },
    });
    return 'complete';
  }
  await prisma.mailSyncLog.create({
    data: { mailAccountId, kind: MailSyncLogKind.SYNC_FAILED, detail },
  });
  await prisma.mailAccount.update({
    where: { id: mailAccountId },
    data: { status: 'DEGRADED', lastErrorAt: new Date() },
  });
  await prisma.mailProviderConnection.update({
    where: { mailAccountId },
    data: { status: 'DEGRADED', lastErrorAt: new Date(), lastErrorMessage: detail },
  });
  return 'retry';
}
