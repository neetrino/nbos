import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { deliveryFunctionsApi } from '@/lib/api/delivery-functions';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { CATALOG_FIRST_PAINT_PAGE_SIZE } from './function-catalog.constants';
import { visibleSalePriceByFunctionId, type VisibleSalePrice } from './function-catalog-sale-price';
import { loadCatalogUnitsIfPermitted } from './function-catalog-units';

export type CatalogQuerySnapshot = {
  items: DeliveryFunctionOperationalDto[];
  unitsByFunctionId: Map<string, number> | undefined;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
};

type CatalogFilters = { search?: string; status?: string };

export async function loadCatalogQuery(input: {
  search: string;
  status?: string;
  canSeeRules: boolean;
  hasVisibleItems: boolean;
  onFirstPaint?: (snapshot: CatalogQuerySnapshot) => void;
}): Promise<CatalogQuerySnapshot> {
  const filters: CatalogFilters = { search: input.search || undefined, status: input.status };
  if (input.hasVisibleItems) {
    return loadFullCatalog(filters, input.canSeeRules);
  }
  return loadFirstPaintThenRest(filters, input.canSeeRules, input.onFirstPaint);
}

async function loadFirstPaintThenRest(
  filters: CatalogFilters,
  canSeeRules: boolean,
  onFirstPaint?: (snapshot: CatalogQuerySnapshot) => void,
): Promise<CatalogQuerySnapshot> {
  const [first, extras] = await Promise.all([
    deliveryFunctionsApi.list({
      ...filters,
      page: 1,
      pageSize: CATALOG_FIRST_PAINT_PAGE_SIZE,
    }),
    loadCatalogExtras(canSeeRules),
  ]);
  const firstSnapshot = snapshotFor(first.items, extras, canSeeRules);
  onFirstPaint?.(firstSnapshot);
  if (first.meta.total <= first.items.length) return firstSnapshot;
  const items = await deliveryFunctionsApi.listAll(filters);
  return snapshotFor(items, extras, canSeeRules);
}

async function loadFullCatalog(
  filters: CatalogFilters,
  canSeeRules: boolean,
): Promise<CatalogQuerySnapshot> {
  const [items, extras] = await Promise.all([
    deliveryFunctionsApi.listAll(filters),
    loadCatalogExtras(canSeeRules),
  ]);
  return snapshotFor(items, extras, canSeeRules);
}

async function loadCatalogExtras(canSeeRules: boolean) {
  const [saleVersions, unitsByFunctionId] = await Promise.all([
    deliveryCatalogStructureApi.listSalePrices(),
    loadCatalogUnitsIfPermitted(canSeeRules, () => deliveryNormsApi.listFunctionPrices()),
  ]);
  return { saleVersions, unitsByFunctionId };
}

function snapshotFor(
  items: DeliveryFunctionOperationalDto[],
  extras: Awaited<ReturnType<typeof loadCatalogExtras>>,
  canSeeRules: boolean,
): CatalogQuerySnapshot {
  return {
    items,
    unitsByFunctionId: extras.unitsByFunctionId,
    salePriceByFunctionId: visibleSalePriceByFunctionId(
      items.map((item) => item.id),
      extras.saleVersions,
      canSeeRules,
    ),
  };
}
