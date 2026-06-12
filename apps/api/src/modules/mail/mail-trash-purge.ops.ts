import type { PrismaClient } from '@nbos/database';
import type { AuditService } from '../audit/audit.service';
import { PLATFORM_SCHEDULER_AUDIT_ACTOR_ID } from '../platform-lifecycle/platform-trash-purge.constants';
import { MAIL_TRASH_PURGE_BATCH_CAP } from './mail-trash-retention.constants';
import { trashedMailThreadRetentionWhere } from './mail-trash-retention.where';
import {
  MAIL_AUDIT_ACTION_THREAD_RETENTION_PURGED,
  MAIL_AUDIT_ENTITY_THREAD,
} from './mail-audit.constants';

export interface MailTrashPurgeResult {
  purged: number;
  candidateIds: string[];
}

/** Hard-deletes trashed mail threads past retention (messages/attachments cascade). */
export async function purgeTrashedMailThreadsPastRetention(
  prisma: InstanceType<typeof PrismaClient>,
  auditService: AuditService,
  now: Date,
  retentionMs?: number,
): Promise<MailTrashPurgeResult> {
  const where = trashedMailThreadRetentionWhere(now, retentionMs);
  const candidates = await prisma.emailThread.findMany({
    where,
    select: { id: true, mailAccountId: true, subjectNormalized: true },
    orderBy: { trashedAt: 'asc' },
    take: MAIL_TRASH_PURGE_BATCH_CAP,
  });

  if (candidates.length === 0) {
    return { purged: 0, candidateIds: [] };
  }

  const ids = candidates.map((row) => row.id);
  const result = await prisma.emailThread.deleteMany({ where: { id: { in: ids } } });

  await Promise.all(
    candidates.map((row) =>
      auditService.log({
        entityType: MAIL_AUDIT_ENTITY_THREAD,
        entityId: row.id,
        action: MAIL_AUDIT_ACTION_THREAD_RETENTION_PURGED,
        userId: PLATFORM_SCHEDULER_AUDIT_ACTOR_ID,
        changes: {
          mailAccountId: row.mailAccountId,
          subjectNormalized: row.subjectNormalized,
          scheduled: true,
        },
      }),
    ),
  );

  return { purged: result.count, candidateIds: ids };
}
