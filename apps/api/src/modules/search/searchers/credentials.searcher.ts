import { buildScopeWhere } from '../../../common/lifecycle/entity-lifecycle-scope';
import { buildCredentialListWhere } from '../../credentials/credential-list-where';
import type { CredentialsAccessContext } from '../../credentials/credentials-access';
import type { CredentialsRuntime } from '../../credentials/credentials-runtime';
import { buildCredentialSearchHref } from '../search-href';
import type { SearchHit } from '../search.types';

export async function searchCredentials(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const where = await buildCredentialListWhere(runtime, {
    search: query,
    employeeId: access.employeeId,
    departmentIds: access.departmentIds,
    bypassRowVisibility: access.bypassRowVisibility,
    executiveProjectAccess: access.executiveProjectAccess,
    scope: 'active',
  });

  Object.assign(where, buildScopeWhere('active'));

  const rows = await runtime.prisma.credential.findMany({
    where,
    select: {
      id: true,
      name: true,
      login: true,
      updatedAt: true,
      createdAt: true,
      provider: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    group: 'credentials',
    entityType: 'credential',
    title: row.name,
    subtitle: row.provider?.name?.trim() || row.login?.trim() || 'Credential',
    href: buildCredentialSearchHref(row.id),
    occurredAt: (row.updatedAt ?? row.createdAt).toISOString(),
  }));
}
