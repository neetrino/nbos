import type { UnitEconomicsOrderDetail, UnitEconomicsRow } from '@/lib/api/unit-economics';

const EMPTY_BONUS_BREAKDOWN: UnitEconomicsOrderDetail['bonusBreakdown'] = {
  poolKey: '',
  pool: null,
  employeeLines: [],
};

/** Instant drilldown header/summary from unit economics table row. */
export function buildUnitEconomicsOrderDetailPlaceholder(
  row: UnitEconomicsRow,
): UnitEconomicsOrderDetail {
  return {
    orderId: row.orderId,
    orderCode: row.orderCode,
    label: row.label,
    projectCode: row.projectCode,
    projectId: row.projectId,
    orderType: row.orderType,
    summary: {
      invoicedAmount: row.invoicedAmount,
      receivedAmount: row.receivedAmount,
      receivableAmount: row.receivableAmount,
      expensesPaidAmount: row.expensesPaidAmount,
      plannedBonuses: row.plannedBonuses,
      releasedBonuses: row.releasedBonuses,
      paidBonuses: row.paidBonuses,
      remainingBonuses: row.remainingBonuses,
      cashBalance: row.cashBalance,
      outFactAmount: row.outFactAmount,
      outCommittedAmount: row.outCommittedAmount,
      marginFact: row.marginFact,
      marginAfterCommitments: row.marginAfterCommitments,
      overReleaseAmount: row.overReleaseAmount,
    },
    invoices: [],
    payments: [],
    expenses: [],
    bonuses: [],
    bonusBreakdown: EMPTY_BONUS_BREAKDOWN,
  };
}
