import type { Prisma } from '@nbos/database';
import { CREDENTIAL_LIST_SELECT } from './credential-list-select';
import { loadCredentialSecretsPresence } from './credential-list-secrets-presence';
import { mapCredentialForApi } from './credential-api.mapper';
import type { CredentialQueryParams } from './credential-domain.types';
import type { CredentialListSort } from './credential-list-sort';
import { loadRecentOrderedCredentialIds } from './credential-list-recent-ids';
import type { CredentialsAccessContext } from './credentials-access';
import type { CredentialsRuntime } from './credentials-runtime';

/** Overrides list `secretsPresent` with booleans computed in SQL (blobs not fetched). */
async function withSecretsPresence(
  runtime: CredentialsRuntime,
  items: ReturnType<typeof mapCredentialForApi>[],
): Promise<ReturnType<typeof mapCredentialForApi>[]> {
  if (items.length === 0) return items;
  const presence = await loadCredentialSecretsPresence(
    runtime.prisma,
    items.map((item) => item.id),
  );
  return items.map((item) => ({
    ...item,
    secretsPresent: presence.get(item.id) ?? item.secretsPresent,
  }));
}

type FavoriteDelegate = {
  findMany: (args: unknown) => Promise<Array<{ credentialId: string }>>;
};

function favoriteDelegate(runtime: CredentialsRuntime): FavoriteDelegate | null {
  return (
    (
      runtime.prisma as unknown as {
        credentialFavorite?: FavoriteDelegate;
      }
    ).credentialFavorite ?? null
  );
}

async function withListMetadata(
  runtime: CredentialsRuntime,
  items: ReturnType<typeof mapCredentialForApi>[],
  employeeId?: string,
): Promise<ReturnType<typeof mapCredentialForApi>[]> {
  const withPresence = await withSecretsPresence(runtime, items);
  if (!employeeId || withPresence.length === 0) return withPresence;

  const delegate = favoriteDelegate(runtime);
  if (!delegate) return withPresence;

  const favorites = await delegate.findMany({
    where: {
      employeeId,
      credentialId: { in: withPresence.map((item) => item.id) },
    },
    select: { credentialId: true },
  });
  const favoriteIds = new Set(favorites.map((favorite) => favorite.credentialId));
  return withPresence.map((item) => ({
    ...item,
    isFavorite: favoriteIds.has(item.id),
  }));
}

async function fetchCredentialsByOrderedIds(
  runtime: CredentialsRuntime,
  ids: string[],
  employeeId?: string,
): Promise<ReturnType<typeof mapCredentialForApi>[]> {
  if (ids.length === 0) return [];
  const rows = await runtime.prisma.credential.findMany({
    where: { id: { in: ids } },
    select: CREDENTIAL_LIST_SELECT,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => row !== undefined)
    .map((row) => mapCredentialForApi(row));
  return withListMetadata(runtime, ordered, employeeId);
}

function resolveCredentialListOrderBy(sort: CredentialListSort, trashList: boolean) {
  if (sort === 'name_asc') return { name: 'asc' as const };
  if (trashList) return { archivedAt: 'desc' as const };
  return { createdAt: 'desc' as const };
}

export async function findCredentialListPageStandard(
  runtime: CredentialsRuntime,
  where: Prisma.CredentialWhereInput,
  sort: CredentialListSort,
  params: CredentialQueryParams,
  trashList = false,
) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const orderBy = resolveCredentialListOrderBy(sort, trashList);

  const [rows, total] = await Promise.all([
    runtime.prisma.credential.findMany({
      where,
      select: CREDENTIAL_LIST_SELECT,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    runtime.prisma.credential.count({ where }),
  ]);

  return {
    items: await withListMetadata(
      runtime,
      rows.map((row) => mapCredentialForApi(row)),
      params.employeeId,
    ),
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function findCredentialListPageRecentFirst(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  where: Prisma.CredentialWhereInput,
  params: CredentialQueryParams,
) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const [recentOrderedIds, total] = await Promise.all([
    loadRecentOrderedCredentialIds(runtime, access, where),
    runtime.prisma.credential.count({ where }),
  ]);

  const offset = (page - 1) * pageSize;
  const pageIds: string[] = [];

  if (offset < recentOrderedIds.length) {
    pageIds.push(...recentOrderedIds.slice(offset, offset + pageSize));
  }

  const needMore = pageSize - pageIds.length;
  if (needMore > 0) {
    const nonRecentSkip = Math.max(0, offset - recentOrderedIds.length);
    const extra = await runtime.prisma.credential.findMany({
      where: {
        AND: [where, { id: { notIn: recentOrderedIds } }],
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      skip: nonRecentSkip,
      take: needMore,
    });
    pageIds.push(...extra.map((row) => row.id));
  }

  const items = await fetchCredentialsByOrderedIds(runtime, pageIds, access.employeeId);
  return {
    items,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}
