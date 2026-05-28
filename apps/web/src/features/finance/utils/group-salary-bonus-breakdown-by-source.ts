import type { SalaryLineMonthBonusRow } from '@/lib/api/payroll-runs';

const POLICY_PENDING_LABEL = '—';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export type SalaryBonusBreakdownSourceGroup = {
  key: string;
  projectId: string;
  projectCode: string;
  productLabel: string;
  orderCode: string;
  planned: number;
  payable: number;
  released: number;
  burned: number;
  carryOver: number;
  included: number;
  paid: number;
  remaining: number;
  releaseCount: number;
};

type GroupAcc = SalaryBonusBreakdownSourceGroup & {
  plannedByEntry: Map<string, number>;
  payableByEntry: Map<string, number>;
};

function sourceKey(row: SalaryLineMonthBonusRow): string {
  return `${row.projectId}|${row.productLabel}`;
}

/**
 * Rolls up payroll-month bonus releases by project + product label (NBOS bonus source).
 * Planned is deduped per `bonusEntryId` within each group.
 */
export function groupSalaryBonusBreakdownBySource(
  rows: readonly SalaryLineMonthBonusRow[],
): SalaryBonusBreakdownSourceGroup[] {
  const map = new Map<string, GroupAcc>();

  for (const row of rows) {
    const key = sourceKey(row);
    let acc = map.get(key);
    if (!acc) {
      acc = {
        key,
        projectId: row.projectId,
        projectCode: row.projectCode,
        productLabel: row.productLabel,
        orderCode: row.orderCode,
        planned: 0,
        payable: 0,
        released: 0,
        burned: 0,
        carryOver: 0,
        included: 0,
        paid: 0,
        remaining: 0,
        releaseCount: 0,
        plannedByEntry: new Map(),
        payableByEntry: new Map(),
      };
      map.set(key, acc);
    }

    acc.plannedByEntry.set(row.bonusEntryId, parseAmount(row.fullAmount ?? row.plannedAmount));
    if (row.payableAmount != null) {
      acc.payableByEntry.set(row.bonusEntryId, parseAmount(row.payableAmount));
    }
    acc.released += parseAmount(row.releaseAmount);
    if (row.kpiBurnedAmount) {
      acc.burned += parseAmount(row.kpiBurnedAmount);
    }
    if (row.payrollCarryOverAmount) {
      acc.carryOver += parseAmount(row.payrollCarryOverAmount);
    }
    const included = row.includedAmount
      ? parseAmount(row.includedAmount)
      : parseAmount(row.releaseAmount);
    acc.included += included;
    acc.paid += parseAmount(row.paidAmount);
    acc.remaining += parseAmount(row.remainingAmount);
    acc.releaseCount += 1;
  }

  return [...map.values()]
    .map((acc) => ({
      key: acc.key,
      projectId: acc.projectId,
      projectCode: acc.projectCode,
      productLabel: acc.productLabel,
      orderCode: acc.orderCode,
      planned: [...acc.plannedByEntry.values()].reduce((sum, v) => sum + v, 0),
      payable: [...acc.payableByEntry.values()].reduce((sum, v) => sum + v, 0),
      released: acc.released,
      burned: acc.burned,
      carryOver: acc.carryOver,
      included: acc.included,
      paid: acc.paid,
      remaining: acc.remaining,
      releaseCount: acc.releaseCount,
    }))
    .sort((a, b) => a.productLabel.localeCompare(b.productLabel));
}

export { POLICY_PENDING_LABEL };
