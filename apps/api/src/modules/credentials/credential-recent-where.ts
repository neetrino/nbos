import type { Prisma } from '@nbos/database';
import type { CredentialsAccessContext } from './credentials-access';
import { credentialsRbacBypassesRowFilter } from './credentials-access';
import { applyCredentialTabFilter } from './credential-tab-filter';
import { normalizeCredentialTab } from './credential-tab';
import { buildCredentialRowVisibilityWhere } from './credential-visibility.loader';
import { loadCredentialVisibilityContext } from './credential-visibility.loader';
import type { CredentialsRuntime } from './credentials-runtime';

export async function buildRecentCredentialsWhere(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  orderedIds: string[],
  tab?: string,
  search?: string,
): Promise<Prisma.CredentialWhereInput> {
  const where: Prisma.CredentialWhereInput = {
    id: { in: orderedIds },
    archivedAt: null,
    ...(await buildCredentialRowVisibilityWhere(
      runtime.prisma,
      runtime.platformAccessResolver,
      access,
      'view',
    )),
  };

  const normalizedTab = normalizeCredentialTab(tab) ?? 'all';
  const visibilityCtx = !credentialsRbacBypassesRowFilter(access.viewScope)
    ? await loadCredentialVisibilityContext(runtime.prisma, runtime.platformAccessResolver, {
        employeeId: access.employeeId,
        departmentIds: access.departmentIds,
      })
    : undefined;

  applyCredentialTabFilter(
    where,
    normalizedTab,
    access.employeeId,
    visibilityCtx,
    access.viewScope,
  );

  const query = search?.trim();
  if (query) {
    const searchFilter: Prisma.CredentialWhereInput = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { provider: { contains: query, mode: 'insensitive' } },
        { login: { contains: query, mode: 'insensitive' } },
      ],
    };
    if (where.AND) {
      where.AND = Array.isArray(where.AND)
        ? [...where.AND, searchFilter]
        : [where.AND, searchFilter];
    } else {
      where.AND = [searchFilter];
    }
  }

  return where;
}
