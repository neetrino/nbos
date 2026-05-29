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
import { payrollBonusReleaseBase } from './payroll-bonus-release-base';
import {
  PAYROLL_BONUS_RELEASE_LEDGER_STATUSES,
  sumBonusEntryReleasedBefore,
} from './payroll-bonus-entry-released-before';
import { detachBonusReleasesFromPayrollRun } from './payroll-bonus-release-detach';
import { notifyPayrollCarryEventsOnAttach } from './payroll-bonus-carry-notify';
import type { PayrollAttachNotifyEvent } from './payroll-attach-notify.types';
import {
  refreshBonusEntryStatusesForReleases,
  syncProductBonusPoolsForBonusReleases,
} from './payroll-run-bonus-release-side-effects';

const COUNTING_STATUSES = PAYROLL_BONUS_RELEASE_LEDGER_STATUSES;

export type MatrixCellPatchResult = {
  releaseIds: string[];
  carryNotifyEvents: PayrollAttachNotifyEvent[];
};

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
  if (amount.gt(remaining)) return 'EXTRA';
  if (availableFunding.gt(BONUS_POOL_ZERO) && amount.gt(availableFunding)) return 'OVER_FUNDING';
  return 'MANUAL';
}

/**
 * Sets bonus release for one matrix cell: detach prior included amount, create APPROVED release, attach.
 * Returns release ids touched for downstream status/pool sync.
 */
export async function applyMatrixCellPatch(
  tx: TransactionClient,
  params: MatrixCellPatchParams,
): Promise<MatrixCellPatchResult> {
  const { payrollRunId, employeeId, orderId, releaseAmount, reason, approvedById } = params;
  const touched: string[] = [];
  let carryNotifyEvents: PayrollAttachNotifyEvent[] = [];

  const run = await tx.payrollRun.findUnique({
    where: { id: payrollRunId },
    select: { payrollMonth: true },
  });
  if (!run) {
    throw new NotFoundException(`Payroll run ${payrollRunId} not found`);
  }

  const entry = await tx.bonusEntry.findFirst({
    where: { employeeId, orderId },
    select: {
      id: true,
      employeeId: true,
      projectId: true,
      type: true,
      amount: true,
      payableAmount: true,
      earnedPeriod: true,
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
    if (!included) return { releaseIds: touched, carryNotifyEvents };
    await detachBonusReleasesFromPayrollRun(tx, { payrollRunId, releaseIds: [included.id] });
    touched.push(included.id);
    return { releaseIds: touched, carryNotifyEvents };
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

  const ledgerReleases = await tx.bonusRelease.findMany({
    where: {
      bonusEntryId: entry.id,
      status: { in: [...COUNTING_STATUSES] },
    },
    select: {
      payrollRunId: true,
      status: true,
      amount: true,
      payrollIncludedAmount: true,
    },
  });
  const releasedBefore = sumBonusEntryReleasedBefore(ledgerReleases, payrollRunId);
  const releaseBase = payrollBonusReleaseBase(
    {
      type: entry.type,
      amount: entry.amount,
      payableAmount: entry.payableAmount,
      earnedPeriod: entry.earnedPeriod,
    },
    run.payrollMonth,
  );
  const remaining = Decimal.max(BONUS_POOL_ZERO, releaseBase.minus(releasedBefore));

  const releaseType = resolveMatrixReleaseType(releaseAmount, remaining, availableFunding);

  if (included) {
    const current = decimalFrom(included.payrollIncludedAmount ?? included.amount);
    if (current.equals(releaseAmount)) return { releaseIds: touched, carryNotifyEvents };
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

  carryNotifyEvents = await attachBonusReleasesToPayrollRun(tx, {
    payrollRunId,
    releaseIds: [created.id],
  });

  return { releaseIds: touched, carryNotifyEvents };
}

/** Post-transaction sync for matrix mutations (pool, status, carry + KPI notify). */
export async function syncAfterMatrixReleaseMutation(
  prisma: InstanceType<typeof PrismaClient>,
  result: MatrixCellPatchResult,
  notifications?: WalletInAppNotifySink,
): Promise<void> {
  const { releaseIds, carryNotifyEvents } = result;
  if (releaseIds.length === 0 && carryNotifyEvents.length === 0) return;
  if (releaseIds.length > 0) {
    await refreshBonusEntryStatusesForReleases(prisma, releaseIds);
    await syncProductBonusPoolsForBonusReleases(prisma, releaseIds, notifications);
  }
  await notifyPayrollCarryEventsOnAttach(prisma, notifications, carryNotifyEvents);
}
