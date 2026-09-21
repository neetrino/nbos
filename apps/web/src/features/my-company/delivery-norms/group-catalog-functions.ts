import type { DeliveryFunctionOperationalDto } from '@nbos/shared';

export type CatalogFunctionGroup = {
  category: string;
  items: DeliveryFunctionOperationalDto[];
};

export function groupCatalogFunctions(
  items: readonly DeliveryFunctionOperationalDto[],
): CatalogFunctionGroup[] {
  const order: string[] = [];
  const grouped = new Map<string, DeliveryFunctionOperationalDto[]>();
  for (const item of items) {
    const list = grouped.get(item.category);
    if (!list) {
      grouped.set(item.category, [item]);
      order.push(item.category);
      continue;
    }
    list.push(item);
  }
  return order.map((category) => ({
    category,
    items: grouped.get(category) ?? [],
  }));
}

export function catalogFunctionSearchParts(item: DeliveryFunctionOperationalDto): string[] {
  return [item.title, item.code, item.category, item.summary];
}

export type PricedFunctionCluster<T> = {
  functionId: string;
  title: string;
  rows: T[];
};

export type PricedFunctionCategoryGroup<T> = {
  category: string;
  functions: PricedFunctionCluster<T>[];
};

export function groupPricedFunctions<T extends { functionId: string }>(
  rows: readonly T[],
  catalog: readonly Pick<DeliveryFunctionOperationalDto, 'id' | 'title' | 'category'>[],
  unknownTitle: string,
): PricedFunctionCategoryGroup<T>[] {
  const catalogById = new Map(catalog.map((item) => [item.id, item] as const));
  const clusters = clusterByFunctionId(rows, catalogById, unknownTitle);
  const categoryOrder: string[] = [];
  const grouped = new Map<string, PricedFunctionCluster<T>[]>();
  for (const cluster of clusters) {
    const category = catalogById.get(cluster.functionId)?.category ?? unknownTitle;
    const list = grouped.get(category);
    if (!list) {
      grouped.set(category, [cluster]);
      categoryOrder.push(category);
      continue;
    }
    list.push(cluster);
  }
  return categoryOrder.map((category) => ({
    category,
    functions: grouped.get(category) ?? [],
  }));
}

function clusterByFunctionId<T extends { functionId: string }>(
  rows: readonly T[],
  catalogById: Map<string, Pick<DeliveryFunctionOperationalDto, 'id' | 'title' | 'category'>>,
  unknownTitle: string,
): PricedFunctionCluster<T>[] {
  const order: string[] = [];
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const list = grouped.get(row.functionId);
    if (!list) {
      grouped.set(row.functionId, [row]);
      order.push(row.functionId);
      continue;
    }
    list.push(row);
  }
  return order.map((functionId) => ({
    functionId,
    title: catalogById.get(functionId)?.title ?? unknownTitle,
    rows: grouped.get(functionId) ?? [],
  }));
}
