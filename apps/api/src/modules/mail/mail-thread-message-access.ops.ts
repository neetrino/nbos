import type { Prisma, PrismaClient } from '@nbos/database';
import type { MailThreadWithAccount } from './mail-thread-access.ops';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';

export type MailThreadMessageEditAccess =
  | { status: 'no_mailbox' }
  | { status: 'no_message' }
  | { status: 'ok'; thread: MailThreadWithAccount; message: Prisma.EmailMessageModel };

/**
 * Resolves mailbox RBAC and loads the message row in the thread (any direction).
 */
export async function fetchMailThreadMessageForEdit(
  prisma: InstanceType<typeof PrismaClient>,
  params: { threadId: string; messageId: string; employeeId: string; accessScope: string },
): Promise<MailThreadMessageEditAccess> {
  const thread = await getMailThreadWithMailboxAccess(prisma, {
    threadId: params.threadId,
    employeeId: params.employeeId,
    accessScope: params.accessScope,
  });
  if (!thread) {
    return { status: 'no_mailbox' };
  }
  const message = await prisma.emailMessage.findFirst({
    where: { id: params.messageId, threadId: params.threadId },
  });
  if (!message) {
    return { status: 'no_message' };
  }
  return { status: 'ok', thread, message };
}
