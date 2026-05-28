import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Decimal,
  type BonusReleaseTypeEnum,
  type PrismaClient,
  type TransactionClient,
} from '@nbos/database';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';
import { attachBonusReleasesToPayrollRun } from './payroll-bonus-release-attach';
import { detachBonusReleasesFromPayrollRun } from './payroll-bonus-release-detach';
import {
  refreshBonusEntryStatusesForReleases,
  syncProductBonusPoolsForBonusReleases,
} from './payroll-run-bonus-release-side-effects';

const COUNTING_STATUSES = ['DRAFT', 'APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID'] as const;

export type MatrixCellPatchParams = {
  payrollRunId: string;
  employeeId: string;
  orderId: string;
  releaseAmount: Decimal;
  reason?: string;
  approvedById: string;
};

/** Classify matrix release amount vs planned remaining and order funding. */
export function resolveMatrixReleaseType(
  amount: Decimal,
  remaining: Decimal,
  availableFunding: Decimal,
): BonusReleaseTypeEnum {
  if (amount.gt(availableFunding)) return 'OVER_FUNDING';
  if (amount.gt(remaining)) return 'EXTRA';
  return 'MANUAL';
}

function requireReason(releaseType: BonusReleaseTypeEnum, reason: string | undefined): void {
  if (releaseType === 'EXTRA' || releaseType === 'OVER_FUNDING') {
    const r = reason?.trim() ?? '';
    if (r.length === 0) {
      throw new BadRequestException(`reason is required for ${releaseType} release`);
    }
  }
}

/**
 * Sets bonus release for one matrix cell: detach prior included amount, create APPROVED release, attach.
 * Returns release ids touched for downstream status/pool sync.
 */
export async function applyMatrixCellPatch(
  tx: TransactionClient,
  params: MatrixCellPatchParams,
): Promise<string[]> {
  const { payrollRunId, employeeId, orderId, releaseAmount, reason, approvedById } = params;
  const touched: string[] = [];

  const entry = await tx.bonusEntry.findFirst({
    where: { employeeId, orderId },
    select: {
      id: true,
      employeeId: true,
      projectId: true,
      amount: true,
      order: { select: { productId: true, extensionId: true } },
    },
  });

  const included = entry
    ? await tx.bonusRelease.findFirst({
        where: {
          bonusEntryId: entry.id,
          payrollRunId,
          status: 'INCLUDED_IN_PAYROLL',
        },
        select: { id: true, amount: true, payrollIncludedAmount: true },
      })
    : null;

  if (releaseAmount.lte(BONUS_POOL_ZERO)) {
    if (!included) return touched;
    await detachBonusReleasesFromPayrollRun(tx, { payrollRunId, releaseIds: [included.id] });
    touched.push(included.id);
    return touched;
  }

  if (!entry) {
    throw new BadRequestException(
      'No bonus entry for this employee and delivery unit. Create a manual bonus first.',
    );
  }

  const pool = await tx.productBonusPool.findUnique({
    where: { orderId },
    select: { availableFunding: true },
  });
  const availableFunding = pool ? decimalFrom(pool.availableFunding) : BONUS_POOL_ZERO;

  const releasedAgg = await tx.bonusRelease.aggregate({
    where: {
      bonusEntryId: entry.id,
      status: { in: [...COUNTING_STATUSES] },
      ...(included ? { id: { not: included.id } } : {}),
    },
    _sum: { amount: true },
  });
  const releasedBefore = decimalFrom(releasedAgg._sum.amount);
  const planned = decimalFrom(entry.amount);
  const remaining = Decimal.max(BONUS_POOL_ZERO, planned.minus(releasedBefore));

  const releaseType = resolveMatrixReleaseType(releaseAmount, remaining, availableFunding);
  requireReason(releaseType, reason);
  if (releaseType === 'OVER_FUNDING' && !approvedById.trim()) {
    throw new BadRequestException('approvedById is required for over funding');
  }

  if (included) {
    const current = decimalFrom(included.payrollIncludedAmount ?? included.amount);
    if (current.equals(releaseAmount)) return touched;
    await detachBonusReleasesFromPayrollRun(tx, { payrollRunId, releaseIds: [included.id] });
    touched.push(included.id);
  }

  const created = await tx.bonusRelease.create({
    data: {
      bonusEntryId: entry.id,
      employeeId: entry.employeeId,
      projectId: entry.projectId,
      productId: entry.order.productId,
      extensionId: entry.order.extensionId,
      amount: releaseAmount,
      releaseType,
      reason: reason?.trim() || null,
      approvedById: releaseType === 'OVER_FUNDING' ? approvedById : null,
      status: 'APPROVED',
    },
  });
  touched.push(created.id);

  await attachBonusReleasesToPayrollRun(tx, {
    payrollRunId,
    releaseIds: [created.id],
  });

  return touched;
}

/** Post-transaction sync for matrix mutations (pool + bonus entry status). */
export async function syncAfterMatrixReleaseMutation(
  prisma: InstanceType<typeof PrismaClient>,
  releaseIds: string[],
  notifications?: WalletInAppNotifySink,
): Promise<void> {
  if (releaseIds.length === 0) return;
  await refreshBonusEntryStatusesForReleases(prisma, releaseIds);
  await syncProductBonusPoolsForBonusReleases(prisma, releaseIds, notifications);
}
