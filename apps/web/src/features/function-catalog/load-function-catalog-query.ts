import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { deliveryFunctionsApi } from '@/lib/api/delivery-functions';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { CATALOG_PAGE_SIZE, FUNCTION_CATALOG_ALL_ID } from './function-catalog.constants';
import { countFunctionsByCategory } from './function-catalog-grouping';
import { visibleSalePriceByFunctionId, type VisibleSalePrice } from './function-catalog-sale-price';
import { loadCatalogUnitsIfPermitted } from './function-catalog-units';

export type CatalogQuerySnapshot = {
  items: DeliveryFunctionOperationalDto[];
  total: number;
  categoryCounts: Record<string, number>;
  unitsByFunctionId: Map<string, number> | undefined;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
};

export type CatalogFilters = {
  search?: string;
  status?: string;
  category?: string;
};

export type CatalogExtras = {
  saleVersions: Awaited<ReturnType<typeof deliveryCatalogStructureApi.listSalePrices>>;
  unitsByFunctionId: Map<string, number> | undefined;
};

export async function loadCatalogPage(input: {
  filters: CatalogFilters;
  page: number;
  canSeeRules: boolean;
  extras?: CatalogExtras;
}): Promise<CatalogQuerySnapshot> {
  const [listed, extras] = await Promise.all([
    deliveryFunctionsApi.list({
      ...listFilters(input.filters),
      page: input.page,
      pageSize: CATALOG_PAGE_SIZE,
    }),
    input.extras ?? loadCatalogExtras(input.canSeeRules),
  ]);
  return snapshotFor(listed.items, extras, input.canSeeRules, {
    total: listed.meta.total,
    categoryCounts: listed.meta.categoryCounts ?? {},
  });
}

export async function loadFullCatalog(input: {
  filters: CatalogFilters;
  canSeeRules: boolean;
}): Promise<CatalogQuerySnapshot> {
  const [items, extras] = await Promise.all([
    deliveryFunctionsApi.listAll(listFilters(input.filters)),
    loadCatalogExtras(input.canSeeRules),
  ]);
  return snapshotFor(items, extras, input.canSeeRules, {
    total: items.length,
    categoryCounts: countsFromItems(items),
  });
}

export async function loadCatalogExtras(canSeeRules: boolean): Promise<CatalogExtras> {
  const [saleVersions, unitsByFunctionId] = await Promise.all([
    deliveryCatalogStructureApi.listSalePrices(),
    loadCatalogUnitsIfPermitted(canSeeRules, () => deliveryNormsApi.listFunctionPrices()),
  ]);
  return { saleVersions, unitsByFunctionId };
}

export function listFilters(filters: CatalogFilters): CatalogFilters {
  const category =
    !filters.category || filters.category === FUNCTION_CATALOG_ALL_ID
      ? undefined
      : filters.category;
  return {
    search: filters.search || undefined,
    status: filters.status,
    category,
  };
}

function snapshotFor(
  items: DeliveryFunctionOperationalDto[],
  extras: CatalogExtras,
  canSeeRules: boolean,
  meta: { total: number; categoryCounts: Record<string, number> },
): CatalogQuerySnapshot {
  return {
    items,
    total: meta.total,
    categoryCounts: meta.categoryCounts,
    unitsByFunctionId: extras.unitsByFunctionId,
    salePriceByFunctionId: visibleSalePriceByFunctionId(
      items.map((item) => item.id),
      extras.saleVersions,
      canSeeRules,
    ),
  };
}

function countsFromItems(items: readonly DeliveryFunctionOperationalDto[]): Record<string, number> {
  return Object.fromEntries(countFunctionsByCategory(items));
}
