import type {
  UnitEconomicsProductRollup,
  UnitEconomicsProjectRollup,
  UnitEconomicsRow,
} from '@/lib/api/unit-economics';

export const UE_FILTER_PROJECT_KEY = 'project' as const;
export const UE_FILTER_ORDER_TYPE_KEY = 'orderType' as const;
export const UE_FILTER_DELIVERY_KEY = 'delivery' as const;

export type UnitEconomicsFilterValues = {
  project: string;
  orderType: string;
  delivery: string;
};

export const UE_FILTER_DEFAULTS: UnitEconomicsFilterValues = {
  project: 'all',
  orderType: 'all',
  delivery: 'all',
};

function matchesSearch(haystack: string, query: string): boolean {
  if (!query) return true;
  return haystack.toLowerCase().includes(query);
}

function rowMatchesFilters(row: UnitEconomicsRow, filters: UnitEconomicsFilterValues): boolean {
  if (filters.project !== 'all' && row.projectId !== filters.project) return false;
  if (filters.orderType !== 'all' && row.orderType !== filters.orderType) return false;
  if (filters.delivery === 'open' && !row.deliveryOpen) return false;
  if (filters.delivery === 'closed' && row.deliveryOpen) return false;
  return true;
}

function rowMatchesSearch(row: UnitEconomicsRow, query: string): boolean {
  if (!query) return true;
  const fields = [
    row.orderCode,
    row.label,
    row.projectCode,
    row.projectName,
    row.productLabel,
    row.productGroupName,
  ];
  return fields.some((field) => matchesSearch(field, query));
}

export function filterUnitEconomicsItems(
  items: UnitEconomicsRow[],
  search: string,
  filters: UnitEconomicsFilterValues,
): UnitEconomicsRow[] {
  const query = search.trim().toLowerCase();
  return items.filter((row) => rowMatchesFilters(row, filters) && rowMatchesSearch(row, query));
}

export function filterUnitEconomicsProjects(
  projects: UnitEconomicsProjectRollup[],
  search: string,
  filters: UnitEconomicsFilterValues,
): UnitEconomicsProjectRollup[] {
  const query = search.trim().toLowerCase();
  return projects.filter((row) => {
    if (filters.project !== 'all' && row.projectId !== filters.project) return false;
    if (!query) return true;
    return matchesSearch(row.projectCode, query) || matchesSearch(row.projectName, query);
  });
}

export function filterUnitEconomicsProducts(
  products: UnitEconomicsProductRollup[],
  search: string,
  filters: UnitEconomicsFilterValues,
): UnitEconomicsProductRollup[] {
  const query = search.trim().toLowerCase();
  return products.filter((row) => {
    if (filters.project !== 'all' && row.projectId !== filters.project) return false;
    if (!query) return true;
    return matchesSearch(row.label, query) || matchesSearch(row.projectCode, query);
  });
}

export function uniqueUnitEconomicsProjects(
  items: UnitEconomicsRow[],
): Array<{ id: string; label: string }> {
  const map = new Map<string, string>();
  for (const row of items) {
    if (!map.has(row.projectId)) {
      map.set(row.projectId, `${row.projectCode} · ${row.projectName}`);
    }
  }
  return [...map.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
