import {
  DELIVERY_FUNCTION_CATEGORIES,
  DELIVERY_FUNCTION_STATUSES,
  type DeliveryFunctionStatus,
} from '@nbos/shared';

export const CATALOG_OTHER_CATEGORY = 'other';

export const CATALOG_LIST_DEFAULT_PAGE_SIZE = 20;
export const CATALOG_LIST_MAX_PAGE_SIZE = 100;

export type CatalogListQuery = {
  page: number;
  pageSize: number;
  skip: number;
  search: string | null;
  category: string | null;
  status: DeliveryFunctionStatus | null;
};

function toPositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export function parseCatalogListQuery(query: {
  page?: string;
  pageSize?: string;
  search?: string;
  category?: string;
  status?: string;
}): CatalogListQuery {
  const page = toPositiveInt(query.page, 1);
  const pageSize = Math.min(
    toPositiveInt(query.pageSize, CATALOG_LIST_DEFAULT_PAGE_SIZE),
    CATALOG_LIST_MAX_PAGE_SIZE,
  );
  const search = query.search?.trim() || null;
  const category = query.category?.trim() || null;
  const status = DELIVERY_FUNCTION_STATUSES.find((value) => value === query.status) ?? null;
  return { page, pageSize, skip: (page - 1) * pageSize, search, category, status };
}

export function buildCatalogListWhere(
  query: CatalogListQuery,
  includeNonActive: boolean,
): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (!includeNonActive) {
    where.status = 'ACTIVE';
  } else if (query.status) {
    where.status = query.status;
  }
  if (query.category === CATALOG_OTHER_CATEGORY) {
    where.category = { notIn: [...DELIVERY_FUNCTION_CATEGORIES] };
  } else if (query.category) {
    where.category = query.category;
  }
  if (query.search) {
    where.OR = [
      { code: { contains: query.search, mode: 'insensitive' } },
      { contentVersions: { some: { title: { contains: query.search, mode: 'insensitive' } } } },
      { contentVersions: { some: { summary: { contains: query.search, mode: 'insensitive' } } } },
    ];
  }
  return where;
}

/** Rail counts stay complete while a category filter pages that slice. */
export function whereWithoutCategory(where: Record<string, unknown>): Record<string, unknown> {
  const { category: _category, ...rest } = where;
  return rest;
}
