import type { Prisma, PrismaClient } from '@nbos/database';
import { mailAccountWhereForViewer } from './mail-account-scope';

export type MailThreadWithAccount = Prisma.EmailThreadGetPayload<{
  include: { mailAccount: true };
}>;

/**
 * Loads thread + mail account when the employee may access the mailbox for the given RBAC scope.
 */
export async function getMailThreadWithMailboxAccess(
  prisma: InstanceType<typeof PrismaClient>,
  params: { threadId: string; employeeId: string; accessScope: string },
): Promise<MailThreadWithAccount | null> {
  const thread = await prisma.emailThread.findFirst({
    where: { id: params.threadId },
    include: { mailAccount: true },
  });
  if (!thread) {
    return null;
  }
  const accountOk = await prisma.mailAccount.findFirst({
    where: {
      id: thread.mailAccountId,
      ...mailAccountWhereForViewer(params.employeeId, params.accessScope),
    },
  });
  if (!accountOk) {
    return null;
  }
  return thread;
}
