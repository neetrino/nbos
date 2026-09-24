import { sumPayableRoleUnits, type DeliveryRoleUnitInput } from '@nbos/shared';
import { formatUnitSum, UNIT_SUM_EMPTY } from './format-unit-sum';
import { targetKeyForKind, type SalePriceTargetKind } from './sale-price-draft';

type UnitVector = Pick<DeliveryRoleUnitInput, 'unitKind' | 'units'>;

export type SaleFunctionUnitRow = {
  status: string;
  functionId: string;
  tierId: string | null;
  roleUnits: readonly UnitVector[];
};

export type SaleCoreUnitRow = {
  id: string;
  roleUnits: readonly UnitVector[];
};

/** Payable unit total for each sale-price row. A draft replaces the published vector. */
export function saleUnitTotals(
  kind: SalePriceTargetKind,
  prices: readonly SaleFunctionUnitRow[],
  profiles: readonly SaleCoreUnitRow[],
): Map<string, string> {
  if (kind === 'CORE') return coreUnitTotals(profiles);
  return catalogUnitTotals(kind, prices);
}

function coreUnitTotals(profiles: readonly SaleCoreUnitRow[]): Map<string, string> {
  return new Map(
    profiles.map((row) => [targetKeyForKind('CORE', row.id), formatPayable(row.roleUnits)]),
  );
}

function catalogUnitTotals(
  kind: 'FUNCTION' | 'TIER',
  prices: readonly SaleFunctionUnitRow[],
): Map<string, string> {
  const totals = new Map<string, string>();
  for (const row of prices) {
    const id = catalogTargetId(kind, row);
    if (!id) continue;
    const key = targetKeyForKind(kind, id);
    if (row.status === 'DRAFT' || !totals.has(key)) {
      totals.set(key, formatPayable(row.roleUnits));
    }
  }
  return totals;
}

function catalogTargetId(kind: 'FUNCTION' | 'TIER', row: SaleFunctionUnitRow): string | null {
  if (row.status === 'ARCHIVED') return null;
  if (kind === 'FUNCTION') return row.tierId === null ? row.functionId : null;
  return row.tierId;
}

function formatPayable(rows: readonly UnitVector[]): string {
  const total = sumPayableRoleUnits(rows);
  return total === null ? UNIT_SUM_EMPTY : formatUnitSum(total);
}
