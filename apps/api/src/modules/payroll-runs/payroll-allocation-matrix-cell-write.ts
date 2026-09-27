import { BadRequestException } from '@nestjs/common';
import { Decimal, PrismaClient, type PayrollBonusAllocationKindEnum } from '@nbos/database';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import {
  isPayrollMatrixBonusEntryVisible,
  payrollBonusReleaseBase,
} from './payroll-bonus-release-base';
import { sumBonusEntryReleasedBefore } from './payroll-bonus-entry-released-before';
import { resolvePayrollMatrixCellState } from './payroll-allocation-matrix-cell-state';
import { resolveMatrixExceptionDraftReason } from './payroll-allocation-exception-reason';
import type { PayrollMatrixCellState } from './payroll-allocation-matrix.types';

const CLOSED_DELIVERY_STATUSES = new Set(['DONE', 'LOST', 'TRANSFER']);

type PatchCellEntry = {
  id: string;
  type: string;
  amount: Decimal;
  payableAmount: Decimal | null;
  earnedPeriod: string | null;
  dealId: string | null;
  salesAccrualInvoiceId: string | null;
  calculationSnapshot: unknown;
};

type PatchCellOrder = {
  projectId: string;
  product: { status: string } | null;
  extension: { status: string } | null;
  productBonusPool: { availableFunding: Decimal } | null;
  bonusEntries: PatchCellEntry[];
};

type PatchCellRelease = {
  payrollRunId: string | null;
  status: string;
  amount: Decimal;
  payrollIncludedAmount: Decimal | null;
};

type PatchCellDraftDb = Pick<
  InstanceType<typeof PrismaClient>,
  'order' | 'bonusRelease' | 'payrollBonusAllocationDraft'
>;

export function allocationKindFromCellState(
  state: PayrollMatrixCellState,
): PayrollBonusAllocationKindEnum {
  if (state === 'EXTRA_BONUS') return 'EXTRA_BONUS';
  if (state === 'OVER_FUNDING') return 'OVER_FUNDING';
  if (state === 'MANUAL_BONUS') return 'MANUAL_BONUS';
  if (state === 'PROGRESS') return 'PROGRESS';
  if (state === 'PARTIALLY_FUNDED') return 'PARTIALLY_FUNDED';
  return 'READY';
}

export async function writePayrollMatrixCellDraft(
  db: PatchCellDraftDb,
  params: {
    payrollRunId: string;
    payrollMonth: string;
    employeeId: string;
    orderId: string;
    userId: string;
    releaseAmount: Decimal;
    reason: string | undefined;
  },
): Promise<void> {
  const order = await loadPatchCellOrder(db, params.orderId, params.employeeId);
  const entry = order.bonusEntries.find((row) =>
    isPayrollMatrixBonusEntryVisible(row, params.payrollMonth),
  );
  if (!entry) {
    throw new BadRequestException(
      'No bonus entry for this employee and delivery unit. Create a manual bonus first.',
    );
  }
  const entryReleases = await db.bonusRelease.findMany({
    where: {
      bonusEntryId: entry.id,
      status: { in: ['DRAFT', 'APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID'] },
    },
    select: {
      payrollRunId: true,
      status: true,
      amount: true,
      payrollIncludedAmount: true,
    },
  });
  const draft = resolvePatchCellDraftWrite({
    payrollMonth: params.payrollMonth,
    payrollRunId: params.payrollRunId,
    releaseAmount: params.releaseAmount,
    reason: params.reason,
    entry,
    order,
    entryReleases,
  });
  await upsertPayrollMatrixCellDraft(db, params, entry.id, order.projectId, draft);
}

function resolvePatchCellDraftWrite(params: {
  payrollMonth: string;
  payrollRunId: string;
  releaseAmount: Decimal;
  reason: string | undefined;
  entry: PatchCellEntry;
  order: PatchCellOrder;
  entryReleases: PatchCellRelease[];
}): { kind: PayrollBonusAllocationKindEnum; reason: string | null } {
  const remaining = Decimal.max(
    BONUS_POOL_ZERO,
    payrollBonusReleaseBase(params.entry, params.payrollMonth).minus(
      sumBonusEntryReleasedBefore(params.entryReleases, params.payrollRunId),
    ),
  );
  const state = resolvePayrollMatrixCellState({
    linked: true,
    hasBonusEntry: true,
    releaseAmount: params.releaseAmount,
    remaining,
    availableFunding: params.order.productBonusPool
      ? decimalFrom(params.order.productBonusPool.availableFunding)
      : BONUS_POOL_ZERO,
    deliveryOpen: isDeliveryUnitOpen(params.order),
    manualBonus: isManualBonusEntry(params.entry),
  });
  return {
    kind: allocationKindFromCellState(state),
    reason: resolveMatrixExceptionDraftReason(state, params.reason, params.entry.type),
  };
}

async function loadPatchCellOrder(
  db: PatchCellDraftDb,
  orderId: string,
  employeeId: string,
): Promise<PatchCellOrder> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      projectId: true,
      product: { select: { status: true } },
      extension: { select: { status: true } },
      productBonusPool: { select: { availableFunding: true } },
      bonusEntries: {
        where: { employeeId },
        select: {
          id: true,
          employeeId: true,
          type: true,
          amount: true,
          payableAmount: true,
          earnedPeriod: true,
          dealId: true,
          salesAccrualInvoiceId: true,
          calculationSnapshot: true,
        },
      },
    },
  });
  if (!order) throw new BadRequestException('Delivery unit not found');
  return order;
}

async function upsertPayrollMatrixCellDraft(
  db: PatchCellDraftDb,
  params: {
    payrollRunId: string;
    employeeId: string;
    orderId: string;
    userId: string;
    releaseAmount: Decimal;
  },
  bonusEntryId: string,
  projectId: string,
  draft: { kind: PayrollBonusAllocationKindEnum; reason: string | null },
): Promise<void> {
  await db.payrollBonusAllocationDraft.upsert({
    where: {
      payrollRunId_employeeId_orderId: {
        payrollRunId: params.payrollRunId,
        employeeId: params.employeeId,
        orderId: params.orderId,
      },
    },
    create: {
      payrollRunId: params.payrollRunId,
      employeeId: params.employeeId,
      orderId: params.orderId,
      projectId,
      bonusEntryId,
      amount: params.releaseAmount,
      kind: draft.kind,
      reason: draft.reason,
      createdById: params.userId,
      updatedById: params.userId,
    },
    update: {
      bonusEntryId,
      projectId,
      amount: params.releaseAmount,
      kind: draft.kind,
      reason: draft.reason,
      updatedById: params.userId,
    },
  });
}

function isDeliveryUnitOpen(order: PatchCellOrder): boolean {
  const productOpen =
    order.product?.status != null && !CLOSED_DELIVERY_STATUSES.has(order.product.status);
  const extensionOpen =
    order.extension?.status != null && !CLOSED_DELIVERY_STATUSES.has(order.extension.status);
  return productOpen || extensionOpen;
}

function isManualBonusEntry(entry: PatchCellEntry): boolean {
  return (
    entry.dealId == null && entry.salesAccrualInvoiceId == null && entry.calculationSnapshot == null
  );
}
