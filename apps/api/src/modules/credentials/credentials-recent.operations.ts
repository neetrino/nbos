import type { CredentialsAccessContext } from './credentials-access';
import {
  CREDENTIAL_RECENT_AUDIT_ACTIONS,
  CREDENTIAL_RECENT_AUDIT_SCAN_LIMIT,
  CREDENTIAL_RECENT_CANDIDATE_POOL,
  CREDENTIAL_RECENT_EXCLUDED_ENTITY_IDS,
  CREDENTIAL_RECENT_LIMIT,
  CREDENTIAL_RECENT_LOOKBACK_DAYS,
} from './credential-recent.constants';
import { buildRecentCredentialsWhere } from './credential-recent-where';
import { dedupeRecentCredentialIds } from './credential-recent-dedupe';
import { CREDENTIAL_LIST_SELECT } from './credential-list-select';
import { toCredentialWithoutSecrets } from './credential-health.utils';
import type { CredentialsRuntime } from './credentials-runtime';

export interface CredentialRecentQuery {
  tab?: string;
  search?: string;
}

function recentLookbackSince(): Date {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - CREDENTIAL_RECENT_LOOKBACK_DAYS);
  return since;
}

export async function findRecentCredentials(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  query: CredentialRecentQuery = {},
) {
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

  const candidateIds = dedupeRecentCredentialIds(auditRows, CREDENTIAL_RECENT_CANDIDATE_POOL);
  if (candidateIds.length === 0) {
    return { items: [] as ReturnType<typeof toCredentialWithoutSecrets>[] };
  }

  const where = await buildRecentCredentialsWhere(
    runtime,
    access,
    candidateIds,
    query.tab,
    query.search,
  );

  const rows = await runtime.prisma.credential.findMany({
    where,
    select: CREDENTIAL_LIST_SELECT,
  });

  const byId = new Map(rows.map((row) => [row.id, row]));
  const items = candidateIds
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => row !== undefined)
    .slice(0, CREDENTIAL_RECENT_LIMIT)
    .map((row) => toCredentialWithoutSecrets(row));

  return { items };
}
