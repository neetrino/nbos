import type { InputJsonValue, PrismaClient } from '@nbos/database';
import { assertEntityIsTrashed } from '../../common/lifecycle/entity-lifecycle-guards';
import type { AuditService } from '../audit/audit.service';
import {
  MAIL_AUDIT_ACTION_THREAD_PERMANENTLY_DELETED,
  MAIL_AUDIT_ENTITY_THREAD,
} from './mail-audit.constants';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import type { MailThreadTrashMutationResult } from './mail-thread-trash.ops';

/** Hard-deletes a trashed thread (messages/attachments cascade). Mailbox access required. */
export async function permanentlyDeleteTrashedMailThread(
  prisma: InstanceType<typeof PrismaClient>,
  auditService: AuditService,
  params: { employeeId: string; accessScope: string; threadId: string },
): Promise<MailThreadTrashMutationResult> {
  const thread = await getMailThreadWithMailboxAccess(prisma, {
    threadId: params.threadId,
    employeeId: params.employeeId,
    accessScope: params.accessScope,
  });
  if (!thread) {
    return { ok: false, reason: 'not_found' };
  }
  assertEntityIsTrashed(thread, 'trashedAt', 'Thread');

  const auditChanges: InputJsonValue = {
    mailAccountId: thread.mailAccountId,
    subjectNormalized: thread.subjectNormalized,
    manual: true,
  };

  await prisma.emailThread.delete({ where: { id: params.threadId } });
  await auditService.log({
    entityType: MAIL_AUDIT_ENTITY_THREAD,
    entityId: params.threadId,
    action: MAIL_AUDIT_ACTION_THREAD_PERMANENTLY_DELETED,
    userId: params.employeeId,
    changes: auditChanges,
  });

  return { ok: true, threadId: params.threadId };
}
