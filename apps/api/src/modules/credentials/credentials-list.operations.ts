import type { Prisma } from '@nbos/database';
import { credentialsRbacBypassesRowFilter } from './credentials-access';
import { buildCredentialVisibilityOr } from './credentials-visibility';
import type { CredentialQueryParams } from './credential-domain.types';
import { applyCredentialTabFilter } from './credential-tab-filter';
import { toCredentialWithoutSecrets } from './credential-health.utils';
import { loadCredentialVisibilityContext } from './credential-visibility.loader';
import { CREDENTIAL_LIST_SELECT } from './credential-list-select';
import type { CredentialsRuntime } from './credentials-runtime';

export async function findAllCredentials(
  runtime: CredentialsRuntime,
  params: CredentialQueryParams,
) {
  const {
    page = 1,
    pageSize = 20,
    projectId,
    category,
    credentialType,
    accessLevel,
    search,
    tab,
    employeeId,
    ownerId,
    departmentIds = [],
    needsRotation = false,
    viewScope,
    includeArchived = false,
  } = params;

  const where: Prisma.CredentialWhereInput = {};
  if (includeArchived) where.archivedAt = { not: null };
  else where.archivedAt = null;

  if (projectId) where.projectId = projectId;
  if (category) where.category = category as Prisma.CredentialWhereInput['category'];
  if (credentialType) {
    where.credentialType = credentialType as Prisma.CredentialWhereInput['credentialType'];
  }
  if (accessLevel) where.accessLevel = accessLevel as Prisma.CredentialWhereInput['accessLevel'];
  if (ownerId) where.ownerId = ownerId;
  if (needsRotation) {
    const dueSoonLimit = new Date();
    dueSoonLimit.setUTCDate(dueSoonLimit.getUTCDate() + 14);
    where.nextRotationAt = { lte: dueSoonLimit };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { provider: { contains: search, mode: 'insensitive' } },
      { login: { contains: search, mode: 'insensitive' } },
    ];
  }

  const visibilityCtx =
    employeeId && !credentialsRbacBypassesRowFilter(viewScope)
      ? await loadCredentialVisibilityContext(runtime.prisma, runtime.platformAccessResolver, {
          employeeId,
          departmentIds,
        })
      : undefined;

  if (tab && employeeId) {
    applyCredentialTabFilter(where, tab, employeeId, visibilityCtx, viewScope);
  } else if (visibilityCtx) {
    where.OR = [...(where.OR ?? []), ...buildCredentialVisibilityOr(visibilityCtx)];
  }

  const [rows, total] = await Promise.all([
    runtime.prisma.credential.findMany({
      where,
      select: CREDENTIAL_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    runtime.prisma.credential.count({ where }),
  ]);

  return {
    items: rows.map((row) => toCredentialWithoutSecrets(row)),
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}
