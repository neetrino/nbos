import type { PrismaClient } from '@nbos/database';
import { assertMailThreadIsActive } from './mail-thread-active-guard.ops';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';

/**
 * Updates `needsBusinessLink` on the thread row.
 * @returns whether a row was updated
 */
export async function updateThreadNeedsBusinessLink(
  prisma: InstanceType<typeof PrismaClient>,
  params: { threadId: string; needsBusinessLink: boolean },
): Promise<boolean> {
  const result = await prisma.emailThread.updateMany({
    where: { id: params.threadId },
    data: { needsBusinessLink: params.needsBusinessLink },
  });
  return result.count > 0;
}

export type PatchThreadNeedsLinkResult =
  | { kind: 'no_access' }
  | { kind: 'noop' }
  | {
      kind: 'updated';
      mailAccountId: string;
      from: boolean;
      to: boolean;
      emailAddress: string;
      ownerEmployeeId: string | null;
      subjectNormalized: string;
    };

/**
 * Resolves mailbox access, skips if unchanged, otherwise persists the new flag.
 */
export async function patchThreadNeedsBusinessLinkIfChanged(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    threadId: string;
    employeeId: string;
    accessScope: string;
    needsBusinessLink: boolean;
  },
): Promise<PatchThreadNeedsLinkResult> {
  const thread = await getMailThreadWithMailboxAccess(prisma, {
    threadId: params.threadId,
    employeeId: params.employeeId,
    accessScope: params.accessScope,
  });
  if (!thread) {
    return { kind: 'no_access' };
  }
  assertMailThreadIsActive(thread);
  if (thread.needsBusinessLink === params.needsBusinessLink) {
    return { kind: 'noop' };
  }
  const updated = await updateThreadNeedsBusinessLink(prisma, {
    threadId: params.threadId,
    needsBusinessLink: params.needsBusinessLink,
  });
  if (!updated) {
    return { kind: 'no_access' };
  }
  return {
    kind: 'updated',
    mailAccountId: thread.mailAccountId,
    from: thread.needsBusinessLink,
    to: params.needsBusinessLink,
    emailAddress: thread.mailAccount.emailAddress,
    ownerEmployeeId: thread.mailAccount.ownerEmployeeId,
    subjectNormalized: thread.subjectNormalized,
  };
}
