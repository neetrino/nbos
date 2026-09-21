import type { DeliveryFunctionPriceFinancialDto } from '@nbos/shared';
import { DRAFT_PRICE_STATUS, PUBLISHED_PRICE_STATUS } from './function-catalog.constants';

export type CatalogPriceRow = Pick<
  DeliveryFunctionPriceFinancialDto,
  'functionId' | 'version' | 'status' | 'roleUnits'
>;

/**
 * Units may be produced only when DELIVERY_COMPENSATION_RULES VIEW is granted.
 * Callers must not fetch prices, and must not pass a total, without that permission.
 */
export function visibleUnitsTotal(
  canViewRules: boolean,
  total: number | undefined,
): number | undefined {
  if (!canViewRules) return undefined;
  return total;
}

export async function loadCatalogUnitsIfPermitted(
  canViewRules: boolean,
  loadPrices: () => Promise<readonly CatalogPriceRow[]>,
): Promise<Map<string, number> | undefined> {
  if (!canViewRules) return undefined;
  return buildUnitsByFunctionId(await loadPrices());
}

export function buildUnitsByFunctionId(rows: readonly CatalogPriceRow[]): Map<string, number> {
  const byFunction = new Map<string, CatalogPriceRow[]>();
  for (const row of rows) {
    const existing = byFunction.get(row.functionId);
    if (existing) existing.push(row);
    else byFunction.set(row.functionId, [row]);
  }
  const totals = new Map<string, number>();
  for (const [functionId, versions] of byFunction) {
    const chosen = pickFunctionPriceVersion(versions);
    if (!chosen) continue;
    const total = sumFunctionRoleUnits(chosen);
    if (total === undefined) continue;
    totals.set(functionId, total);
  }
  return totals;
}

export function pickFunctionPriceVersion(
  rows: readonly CatalogPriceRow[],
): CatalogPriceRow | undefined {
  return (
    newest(rows.filter((row) => row.status === PUBLISHED_PRICE_STATUS)) ??
    newest(rows.filter((row) => row.status === DRAFT_PRICE_STATUS))
  );
}

export function sumFunctionRoleUnits(row: CatalogPriceRow): number | undefined {
  let total = 0;
  let any = false;
  for (const role of row.roleUnits) {
    if (role.unitKind === 'NOT_REQUIRED' || role.units === null) continue;
    const value = Number(role.units);
    if (!Number.isFinite(value)) continue;
    total += value;
    any = true;
  }
  return any ? total : undefined;
}

function newest(rows: readonly CatalogPriceRow[]): CatalogPriceRow | undefined {
  if (rows.length === 0) return undefined;
  return [...rows].sort((left, right) => right.version - left.version)[0];
}
