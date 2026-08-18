import type { PrismaClient } from '@nbos/database';
import { MAIL_SYNCABLE_ACCOUNT_STATUSES } from './mail-sync-runtime.constants';

export function mailSyncReconcileAccountWhere() {
  return { status: { in: [...MAIL_SYNCABLE_ACCOUNT_STATUSES] } };
}

export async function enqueueSyncForActiveMailboxes(params: {
  prisma: InstanceType<typeof PrismaClient>;
  enqueueSync: (mailAccountId: string) => Promise<boolean>;
}): Promise<number> {
  const accounts = await params.prisma.mailAccount.findMany({
    where: mailSyncReconcileAccountWhere(),
    select: { id: true },
  });
  let enqueued = 0;
  for (const account of accounts) {
    if (await params.enqueueSync(account.id)) {
      enqueued += 1;
    }
  }
  return enqueued;
}
