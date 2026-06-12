import type { PrismaClient } from '@nbos/database';
import type { AuditService } from '../audit/audit.service';
import { CREDENTIAL_TRASH_PURGE_BATCH_CAP } from './credential-trash-retention.constants';
import { trashedCredentialRetentionWhere } from './credential-trash-retention.where';

export interface CredentialTrashPurgeResult {
  purged: number;
  candidateIds: string[];
}

/** Hard-deletes trashed credentials past retention (system purge, no step-up). */
export async function purgeTrashedCredentialsPastRetention(
  prisma: InstanceType<typeof PrismaClient>,
  auditService: AuditService,
  now: Date,
): Promise<CredentialTrashPurgeResult> {
  const where = trashedCredentialRetentionWhere(now);
  const candidates = await prisma.credential.findMany({
    where,
    select: { id: true, projectId: true },
    orderBy: { archivedAt: 'asc' },
    take: CREDENTIAL_TRASH_PURGE_BATCH_CAP,
  });

  if (candidates.length === 0) {
    return { purged: 0, candidateIds: [] };
  }

  const ids = candidates.map((row) => row.id);
  const result = await prisma.credential.deleteMany({ where: { id: { in: ids } } });

  await Promise.all(
    candidates.map((row) =>
      auditService.log({
        entityType: 'credential',
        entityId: row.id,
        action: 'credential.retention_purged',
        projectId: row.projectId ?? undefined,
        changes: { scheduled: true },
      }),
    ),
  );

  return { purged: result.count, candidateIds: ids };
}
