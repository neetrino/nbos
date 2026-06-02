import type { CredentialsAccessContext } from './credentials-access';
import {
  CREDENTIAL_RECENT_AUDIT_ACTIONS,
  CREDENTIAL_RECENT_AUDIT_SCAN_LIMIT,
  CREDENTIAL_RECENT_EXCLUDED_ENTITY_IDS,
  CREDENTIAL_RECENT_LOOKBACK_DAYS,
} from './credential-recent.constants';
import { dedupeRecentCredentialIds } from './credential-recent-dedupe';
import { normalizeCredentialTab } from './credential-tab';
import { resolveRecentCredentialItems } from './credential-recent-resolve';
import type { CredentialRecentQuery } from './credential-recent.types';
import type { CredentialsRuntime } from './credentials-runtime';

export type { CredentialRecentQuery } from './credential-recent.types';

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

  const candidateIds = dedupeRecentCredentialIds(auditRows, CREDENTIAL_RECENT_AUDIT_SCAN_LIMIT);
  if (candidateIds.length === 0) {
    return { items: [] as Awaited<ReturnType<typeof resolveRecentCredentialItems>> };
  }

  const tab = normalizeCredentialTab(query.tab) ?? 'all';
  const items = await resolveRecentCredentialItems(runtime, access, candidateIds, tab, query);
  return { items };
}
