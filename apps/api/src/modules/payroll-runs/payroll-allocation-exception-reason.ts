import { BadRequestException } from '@nestjs/common';

const EXCEPTION_ALLOCATION_KEYS = new Set(['EXTRA_BONUS', 'EXTRA', 'EARLY', 'OVER_FUNDING']);
const SALES_BONUS_TYPE = 'SALES';

export function isSalesBonusAllocationType(entryType: string | null | undefined): boolean {
  return entryType === SALES_BONUS_TYPE;
}

/** Stored matrix kind/state for pay-before-done is PROGRESS, not a Prisma EARLY kind. */
export function isEarlyProgressAllocation(
  kindOrState: string,
  entryType: string | null | undefined,
): boolean {
  return kindOrState === 'PROGRESS' && entryType != null && !isSalesBonusAllocationType(entryType);
}

export function payrollAllocationReasonRequired(
  kindOrState: string,
  entryType?: string | null,
): boolean {
  if (EXCEPTION_ALLOCATION_KEYS.has(kindOrState)) {
    return true;
  }
  return isEarlyProgressAllocation(kindOrState, entryType);
}

export function trimPayrollAllocationReason(reason: string | null | undefined): string | null {
  const trimmed = reason?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

export function assertPayrollAllocationExceptionReason(
  kindOrState: string,
  reason: string | null | undefined,
  entryType?: string | null,
): void {
  if (!payrollAllocationReasonRequired(kindOrState, entryType)) {
    return;
  }
  if (trimPayrollAllocationReason(reason) == null) {
    throw new BadRequestException(`reason is required for ${kindOrState} allocations`);
  }
}

export function resolveMatrixExceptionDraftReason(
  cellState: string,
  reason: string | null | undefined,
  entryType?: string | null,
): string | null {
  const trimmed = trimPayrollAllocationReason(reason);
  assertPayrollAllocationExceptionReason(cellState, trimmed, entryType);
  return trimmed;
}
