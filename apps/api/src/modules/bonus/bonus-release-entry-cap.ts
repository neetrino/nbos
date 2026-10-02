import { BadRequestException } from '@nestjs/common';
import { Decimal, type BonusReleaseTypeEnum, type PrismaClient } from '@nbos/database';

import { decimalFrom } from './bonus-pool-decimal';
import { BONUS_RELEASE_COUNTING_STATUSES } from './product-bonus-pool.constants';

export type BonusReleaseCapEntry = {
  type: string;
  amount: Decimal;
  payableAmount: Decimal | null;
};

export const SALES_EXCEPTION_RELEASE_TYPES: ReadonlySet<BonusReleaseTypeEnum> = new Set([
  'EXTRA',
  'OVER_FUNDING',
]);

export function isSalesExceptionReleaseType(releaseType: string): boolean {
  return SALES_EXCEPTION_RELEASE_TYPES.has(releaseType as BonusReleaseTypeEnum);
}

type OrdinaryReleaseSumDb = Pick<InstanceType<typeof PrismaClient>, 'bonusRelease'>;

/** APPROVED / INCLUDED_IN_PAYROLL / PAID releases that are not EXTRA or OVER_FUNDING. */
export async function sumOrdinaryCountingReleases(
  db: OrdinaryReleaseSumDb,
  bonusEntryId: string,
): Promise<Decimal> {
  const agg = await db.bonusRelease.aggregate({
    where: {
      bonusEntryId,
      status: { in: [...BONUS_RELEASE_COUNTING_STATUSES] },
      releaseType: { notIn: [...SALES_EXCEPTION_RELEASE_TYPES] },
    },
    _sum: { amount: true },
  });
  return decimalFrom(agg._sum.amount);
}

export function assertOrdinaryCountingWithinSalesPayable(
  ordinaryTotal: Decimal,
  payableAmount: Decimal | null,
  bonusLabel: string,
): void {
  const cap = payableAmount == null ? decimalFrom(0) : decimalFrom(payableAmount);
  if (ordinaryTotal.gt(cap)) {
    throw new BadRequestException(
      `${bonusLabel} ordinary releases exceed the Sales KPI payable of ${cap.toFixed(2)}.`,
    );
  }
}

/**
 * Sales cap is the stored KPI payable. Null payable is a hold, not a write-off.
 * Non-sales keep the planned entry amount.
 */
export function resolveBonusReleaseCap(entry: BonusReleaseCapEntry): Decimal {
  if (entry.type !== 'SALES') {
    return decimalFrom(entry.amount);
  }
  if (entry.payableAmount == null) {
    throw new BadRequestException(
      'Sales bonus is held pending KPI plan and actual; a release cannot be created.',
    );
  }
  return decimalFrom(entry.payableAmount);
}

export function assertBonusReleaseWithinEntryCap(params: {
  entry: BonusReleaseCapEntry;
  priorCounting: Decimal;
  addAmount: Decimal;
  releaseType: BonusReleaseTypeEnum;
}): void {
  const cap = resolveBonusReleaseCap(params.entry);
  if (SALES_EXCEPTION_RELEASE_TYPES.has(params.releaseType)) {
    return;
  }
  if (params.priorCounting.plus(params.addAmount).gt(cap)) {
    throw new BadRequestException(
      'Release amount exceeds remaining planned amount for this bonus entry',
    );
  }
}
