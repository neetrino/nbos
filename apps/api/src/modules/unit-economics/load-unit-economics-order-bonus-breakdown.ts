import type { PrismaClient } from '@nbos/database';
import { queryBonusPoolEmployeeLines } from '../bonus/bonus-pool-employee-lines';
import {
  deriveBonusPoolFundingMetrics,
  sumPoolLedgerFields,
} from '../bonus/bonus-pool-funding-health';
import { decimalFrom } from '../bonus/bonus-pool-decimal';
import type {
  UnitEconomicsBonusBreakdownDto,
  UnitEconomicsBonusEmployeeLineDto,
  UnitEconomicsBonusPoolDto,
} from './unit-economics.types';

const ORDER_POOL_PREFIX = 'order:';

export function unitEconomicsOrderPoolKey(orderId: string): string {
  return `${ORDER_POOL_PREFIX}${orderId}`;
}

export async function loadUnitEconomicsOrderBonusBreakdown(
  prisma: InstanceType<typeof PrismaClient>,
  order: {
    id: string;
    code: string;
    projectId: string;
    project: { code: string; name: string };
    product: { id: string; name: string } | null;
    extension: { id: string; name: string } | null;
  },
  unitLabel: string,
): Promise<UnitEconomicsBonusBreakdownDto> {
  const poolKey = unitEconomicsOrderPoolKey(order.id);
  const [linesResult, ledger, entryCount] = await Promise.all([
    queryBonusPoolEmployeeLines(prisma, poolKey),
    prisma.productBonusPool.findUnique({
      where: { orderId: order.id },
      select: {
        totalPlannedAmount: true,
        totalReleasedAmount: true,
        totalRemainingAmount: true,
        totalPaidAmount: true,
        availableFunding: true,
        overFundingAmount: true,
        status: true,
      },
    }),
    prisma.bonusEntry.count({ where: { orderId: order.id } }),
  ]);

  if (!ledger && entryCount === 0) {
    return { poolKey, pool: null, employeeLines: [] };
  }

  const merged = ledger
    ? sumPoolLedgerFields([
        {
          totalPlannedAmount: ledger.totalPlannedAmount,
          totalReleasedAmount: ledger.totalReleasedAmount,
          totalRemainingAmount: ledger.totalRemainingAmount,
          availableFunding: ledger.availableFunding,
          overFundingAmount: ledger.overFundingAmount,
          status: ledger.status,
        },
      ])
    : null;

  const planned = merged?.planned ?? decimalFrom(0);
  const metrics = merged
    ? deriveBonusPoolFundingMetrics({
        planned,
        received: merged.received,
        available: merged.available,
        remaining: merged.remaining,
        overFunding: merged.overFunding,
        ledgerStatus: merged.ledgerStatus,
      })
    : { fundingFillPercent: null, fundingHealth: 'UNKNOWN' as const };

  const pipeline = linesResult.lines.reduce(
    (sum, line) => sum.plus(decimalFrom(line.pipelineAmount)),
    decimalFrom(0),
  );
  const paid = linesResult.lines.reduce(
    (sum, line) => sum.plus(decimalFrom(line.paidAmount)),
    decimalFrom(0),
  );

  const pool: UnitEconomicsBonusPoolDto = {
    poolKey,
    poolKind: 'ORDER',
    anchorOrderId: order.id,
    poolName: unitLabel,
    orderCode: order.code,
    projectId: order.projectId,
    projectCode: order.project.code,
    projectName: order.project.name,
    entryCount,
    employeeCount: linesResult.lines.length,
    sumTotalAmount: planned.toFixed(2),
    sumPipelineAmount: pipeline.toFixed(2),
    sumPaidAmount: paid.toFixed(2),
    sumClawbackAmount: '0.00',
    ledgerPlannedAmount: merged ? planned.toFixed(2) : null,
    ledgerReleasedAmount: merged ? merged.released.toFixed(2) : null,
    ledgerRemainingAmount: merged ? merged.remaining.toFixed(2) : null,
    ledgerAvailableFunding: merged ? merged.available.toFixed(2) : null,
    ledgerOverFundingAmount: merged ? merged.overFunding.toFixed(2) : null,
    ledgerReceivedAmount: merged ? merged.received.toFixed(2) : null,
    ledgerPoolStatus: merged?.ledgerStatus ?? null,
    orderIds: [order.id],
    orderCodes: [order.code],
    fundingFillPercent: metrics.fundingFillPercent,
    fundingHealth: metrics.fundingHealth,
  };

  const employeeLines: UnitEconomicsBonusEmployeeLineDto[] = linesResult.lines.map((line) => ({
    employeeId: line.employeeId,
    employeeName: line.employeeName,
    role: line.role,
    bonusTypes: [...line.bonusTypes],
    entryCount: line.entryCount,
    plannedAmount: line.plannedAmount,
    pipelineAmount: line.pipelineAmount,
    releasedAmount: line.releasedAmount,
    includedInPayrollAmount: line.includedInPayrollAmount,
    paidAmount: line.paidAmount,
    remainingAmount: line.remainingAmount,
    burnedAmount: line.burnedAmount,
    carryOverAmount: line.carryOverAmount,
    suggestedReleaseAmount: line.suggestedReleaseAmount,
    kpiGatePassed: line.kpiGatePassed,
    primaryStatus: line.primaryStatus,
  }));

  return { poolKey, pool, employeeLines };
}
