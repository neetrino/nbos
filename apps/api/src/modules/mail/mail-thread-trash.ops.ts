import type { InputJsonValue, PrismaClient } from '@nbos/database';
import {
  assertEntityIsActive,
  assertEntityIsTrashed,
} from '../../common/lifecycle/entity-lifecycle-guards';
import type { AuditService } from '../audit/audit.service';
import {
  MAIL_AUDIT_ACTION_THREAD_RESTORED,
  MAIL_AUDIT_ACTION_THREAD_TRASHED,
  MAIL_AUDIT_ENTITY_THREAD,
} from './mail-audit.constants';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';

export type MailThreadTrashMutationResult =
  | { ok: true; threadId: string }
  | { ok: false; reason: 'not_found' };

export async function moveMailThreadToTrash(
  prisma: InstanceType<typeof PrismaClient>,
  auditService: AuditService,
  params: { employeeId: string; accessScope: string; threadId: string; now?: Date },
): Promise<MailThreadTrashMutationResult> {
  const thread = await getMailThreadWithMailboxAccess(prisma, {
    threadId: params.threadId,
    employeeId: params.employeeId,
    accessScope: params.accessScope,
  });
  if (!thread) {
    return { ok: false, reason: 'not_found' };
  }
  assertEntityIsActive(thread, 'trashedAt', 'Thread');
  const now = params.now ?? new Date();
  await prisma.emailThread.update({
    where: { id: params.threadId },
    data: { trashedAt: now, trashedById: params.employeeId },
  });
  const auditChanges: InputJsonValue = {
    mailAccountId: thread.mailAccountId,
    subjectNormalized: thread.subjectNormalized,
  };
  await auditService.log({
    entityType: MAIL_AUDIT_ENTITY_THREAD,
    entityId: params.threadId,
    action: MAIL_AUDIT_ACTION_THREAD_TRASHED,
    userId: params.employeeId,
    changes: auditChanges,
  });
  return { ok: true, threadId: params.threadId };
}

export async function restoreMailThreadFromTrash(
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
  await prisma.emailThread.update({
    where: { id: params.threadId },
    data: { trashedAt: null, trashedById: null },
  });
  const auditChanges: InputJsonValue = {
    mailAccountId: thread.mailAccountId,
    subjectNormalized: thread.subjectNormalized,
  };
  await auditService.log({
    entityType: MAIL_AUDIT_ENTITY_THREAD,
    entityId: params.threadId,
    action: MAIL_AUDIT_ACTION_THREAD_RESTORED,
    userId: params.employeeId,
    changes: auditChanges,
  });
  return { ok: true, threadId: params.threadId };
}
