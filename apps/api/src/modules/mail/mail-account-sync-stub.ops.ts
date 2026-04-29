import type { PrismaClient } from '@nbos/database';
import { mailAccountWhereForViewer } from './mail-account-scope';

type MailAccountRowDb = Awaited<ReturnType<PrismaClient['mailAccount']['update']>>;

export type RecordMailAccountSyncStubOpResult =
  | { ok: false }
  | { ok: true; account: MailAccountRowDb };

/**
 * MVP stub: bumps `lastSyncAt`, clears `lastErrorAt` when the employee may access the mailbox.
 * Does not call IMAP/Gmail.
 */
export async function recordMailAccountSyncStubOp(
  prisma: InstanceType<typeof PrismaClient>,
  params: { employeeId: string; accessScope: string; accountId: string },
): Promise<RecordMailAccountSyncStubOpResult> {
  const existing = await prisma.mailAccount.findFirst({
    where: {
      id: params.accountId,
      ...mailAccountWhereForViewer(params.employeeId, params.accessScope),
    },
  });
  if (!existing) {
    return { ok: false };
  }
  const account = await prisma.mailAccount.update({
    where: { id: existing.id },
    data: {
      lastSyncAt: new Date(),
      lastErrorAt: null,
    },
  });
  return { ok: true, account };
}
