import type { Prisma } from '@nbos/database';
import {
  CREDENTIAL_RECENT_AUDIT_ACTIONS,
  CREDENTIAL_RECENT_AUDIT_SCAN_LIMIT,
  CREDENTIAL_RECENT_EXCLUDED_ENTITY_IDS,
  CREDENTIAL_RECENT_LOOKBACK_DAYS,
} from './credential-recent.constants';
import { dedupeRecentCredentialIds } from './credential-recent-dedupe';
import type { CredentialsAccessContext } from './credentials-access';
import type { CredentialsRuntime } from './credentials-runtime';

const RECENT_ID_CHUNK_SIZE = 20;

function recentLookbackSince(): Date {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - CREDENTIAL_RECENT_LOOKBACK_DAYS);
  return since;
}

/** Audit-ordered credential ids that match the current list filters (no row limit). */
export async function loadRecentOrderedCredentialIds(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  listWhere: Prisma.CredentialWhereInput,
): Promise<string[]> {
  const auditRows = await runtime.prisma.auditLog.findMany({
    where: {
      userId: access.employeeId,
      entityType: 'credential',
      action: { in: [...CREDENTIAL_RECENT_AUDIT_ACTIONS] },
      entityId: { notIn: [...CREDENTIAL_RECENT_EXCLUDED_ENTITY_IDS] },
      createdAt: { gte: recentLookbackSince() },
    },
    orderBy: { createdAt: 'desc' },
    take: CREDENTIAL_RECENT_AUDIT_SCAN_LIMIT,
    select: { entityId: true, createdAt: true },
  });

  const candidateIds = dedupeRecentCredentialIds(auditRows, CREDENTIAL_RECENT_AUDIT_SCAN_LIMIT);
  if (candidateIds.length === 0) return [];

  const ordered: string[] = [];
  for (let offset = 0; offset < candidateIds.length; offset += RECENT_ID_CHUNK_SIZE) {
    const chunk = candidateIds.slice(offset, offset + RECENT_ID_CHUNK_SIZE);
    const rows = await runtime.prisma.credential.findMany({
      where: { AND: [listWhere, { id: { in: chunk } }] },
      select: { id: true },
    });
    const visible = new Set(rows.map((row) => row.id));
    for (const id of chunk) {
      if (visible.has(id)) ordered.push(id);
    }
  }

  return ordered;
}
