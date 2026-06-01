import type { BonusProductPoolRow } from '@/lib/api/bonus';
import type { UnitEconomicsBonusPool } from '@/lib/api/unit-economics';

const FUNDING_HEALTHS: BonusProductPoolRow['fundingHealth'][] = [
  'EMPTY',
  'PARTIAL',
  'READY',
  'OVER',
  'CLOSED',
  'UNKNOWN',
];

function parseFundingHealth(value: string): BonusProductPoolRow['fundingHealth'] {
  if (FUNDING_HEALTHS.includes(value as BonusProductPoolRow['fundingHealth'])) {
    return value as BonusProductPoolRow['fundingHealth'];
  }
  return 'UNKNOWN';
}

/** Maps Unit Economics order bonus breakdown to the shared bonus pool sheet row shape. */
export function mapUeBonusPoolToProductRow(pool: UnitEconomicsBonusPool): BonusProductPoolRow {
  return {
    poolKey: pool.poolKey,
    poolKind: pool.poolKind,
    anchorOrderId: pool.anchorOrderId,
    poolName: pool.poolName,
    orderCode: pool.orderCode,
    projectId: pool.projectId,
    projectCode: pool.projectCode,
    projectName: pool.projectName,
    entryCount: pool.entryCount,
    sumTotalAmount: pool.sumTotalAmount,
    sumPipelineAmount: pool.sumPipelineAmount,
    sumPaidAmount: pool.sumPaidAmount,
    sumClawbackAmount: pool.sumClawbackAmount,
    ledgerPlannedAmount: pool.ledgerPlannedAmount,
    ledgerReleasedAmount: pool.ledgerReleasedAmount,
    ledgerRemainingAmount: pool.ledgerRemainingAmount,
    ledgerAvailableFunding: pool.ledgerAvailableFunding,
    ledgerOverFundingAmount: pool.ledgerOverFundingAmount,
    ledgerReceivedAmount: pool.ledgerReceivedAmount,
    ledgerPoolStatus: pool.ledgerPoolStatus,
    orderIds: [...pool.orderIds],
    orderCodes: [...pool.orderCodes],
    employeeCount: pool.employeeCount,
    fundingFillPercent: pool.fundingFillPercent,
    fundingHealth: parseFundingHealth(pool.fundingHealth),
  };
}
