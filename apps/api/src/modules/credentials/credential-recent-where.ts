import type { Prisma } from '@nbos/database';
import type { CredentialsAccessContext } from './credentials-access';
import { credentialsRbacBypassesRowFilter } from './credentials-access';
import { applyCredentialTabFilter } from './credential-tab-filter';
import type { CredentialTab } from './credential-tab';
import { buildCredentialRowVisibilityWhere } from './credential-visibility.loader';
import { loadCredentialVisibilityContext } from './credential-visibility.loader';
import type { CredentialRecentQuery } from './credential-recent.types';
import type { CredentialsRuntime } from './credentials-runtime';

export async function buildRecentCredentialsWhere(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  orderedIds: string[],
  tab: CredentialTab,
  query: CredentialRecentQuery = {},
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

  const visibilityCtx = !credentialsRbacBypassesRowFilter(access.viewScope)
    ? await loadCredentialVisibilityContext(runtime.prisma, runtime.platformAccessResolver, {
        employeeId: access.employeeId,
        departmentIds: access.departmentIds,
      })
    : undefined;

  applyCredentialTabFilter(where, tab, access.employeeId, visibilityCtx, access.viewScope);

  if (query.category) {
    where.category = query.category as Prisma.CredentialWhereInput['category'];
  }
  if (query.credentialType) {
    where.credentialType = query.credentialType as Prisma.CredentialWhereInput['credentialType'];
  }
  if (query.needsRotation) {
    const dueSoonLimit = new Date();
    dueSoonLimit.setUTCDate(dueSoonLimit.getUTCDate() + 14);
    where.nextRotationAt = { lte: dueSoonLimit };
  }

  const searchText = query.search?.trim();
  if (searchText) {
    const searchFilter: Prisma.CredentialWhereInput = {
      OR: [
        { name: { contains: searchText, mode: 'insensitive' } },
        { provider: { contains: searchText, mode: 'insensitive' } },
        { login: { contains: searchText, mode: 'insensitive' } },
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
