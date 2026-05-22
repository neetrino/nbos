import { Decimal } from '@nbos/database';

/** Policy-engine breakdown tags (NBOS § Bonus breakdown). */
export type BonusPolicyBreakdownStatus = 'INCOMING' | 'BURNED' | 'CARRY_OVER' | 'CLAWBACK';

export type BonusPolicyBreakdownInput = {
  entryStatus: string;
  kpiBurnedAmount?: Decimal | null;
  payrollCarryOverAmount?: Decimal | null;
  /** Prior-month cap carry still owed (wallet / month summary). */
  pendingPayrollCarryOver?: Decimal | null;
};

function hasPositiveAmount(value: Decimal | null | undefined): boolean {
  return value != null && value.gt(0);
}

/** Derives display/API tags for a bonus entry or payroll release row. */
export function deriveBonusPolicyBreakdownStatuses(
  input: BonusPolicyBreakdownInput,
): BonusPolicyBreakdownStatus[] {
  const tags: BonusPolicyBreakdownStatus[] = [];

  if (input.entryStatus === 'CLAWBACK') {
    tags.push('CLAWBACK');
  }
  if (input.entryStatus === 'INCOMING') {
    tags.push('INCOMING');
  }
  if (hasPositiveAmount(input.kpiBurnedAmount)) {
    tags.push('BURNED');
  }
  if (
    hasPositiveAmount(input.payrollCarryOverAmount) ||
    hasPositiveAmount(input.pendingPayrollCarryOver)
  ) {
    tags.push('CARRY_OVER');
  }

  return tags;
}

export type BonusBreakdownSummaryTotals = {
  incomingCount: number;
  burnedTotal: Decimal;
  carryOverTotal: Decimal;
  clawbackCount: number;
};

export function aggregateBonusBreakdownSummary(
  rows: Array<{
    entryStatus: string;
    kpiBurnedAmount: Decimal | null;
    payrollCarryOverAmount: Decimal | null;
  }>,
  pendingPayrollCarryOver: Decimal,
): BonusBreakdownSummaryTotals {
  let incomingCount = 0;
  let burnedTotal = new Decimal(0);
  let carryOverTotal = new Decimal(0);
  let clawbackCount = 0;

  for (const row of rows) {
    const tags = deriveBonusPolicyBreakdownStatuses({
      entryStatus: row.entryStatus,
      kpiBurnedAmount: row.kpiBurnedAmount,
      payrollCarryOverAmount: row.payrollCarryOverAmount,
    });
    if (tags.includes('INCOMING')) incomingCount += 1;
    if (tags.includes('CLAWBACK')) clawbackCount += 1;
    if (row.kpiBurnedAmount != null && row.kpiBurnedAmount.gt(0)) {
      burnedTotal = burnedTotal.plus(row.kpiBurnedAmount);
    }
    if (row.payrollCarryOverAmount != null && row.payrollCarryOverAmount.gt(0)) {
      carryOverTotal = carryOverTotal.plus(row.payrollCarryOverAmount);
    }
  }

  if (pendingPayrollCarryOver.gt(0)) {
    carryOverTotal = carryOverTotal.plus(pendingPayrollCarryOver);
  }

  return { incomingCount, burnedTotal, carryOverTotal, clawbackCount };
}
