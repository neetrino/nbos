/** Share of the existing developer/DELIVERY pool assigned to Backend when Frontend is a different employee. */
export const DEVELOPER_POOL_BACKEND_PERCENT = 70;
/** Share of the existing developer/DELIVERY pool assigned to Frontend when a distinct assignee is set. */
export const DEVELOPER_POOL_FRONTEND_PERCENT = 30;

const MONEY_CENTS_SCALE = 100;
const PERCENT_BASE = 100;

export interface DeveloperPoolSplit {
  backendAmount: string;
  frontendAmount: string;
}

export type ProductDeveloperSlotId = string | null | undefined;

/** True when Frontend is set and is a different employee from Backend. */
export function hasDistinctFrontendAssignee(
  developerId: ProductDeveloperSlotId,
  frontendDeveloperId: ProductDeveloperSlotId,
): boolean {
  return Boolean(frontendDeveloperId && frontendDeveloperId !== developerId);
}

function amountToCents(total: string | number): number {
  const numeric = typeof total === 'number' ? total : Number(total);
  if (!Number.isFinite(numeric)) {
    throw new RangeError('Developer pool total must be a finite number');
  }
  return Math.round(numeric * MONEY_CENTS_SCALE);
}

function centsToAmount(cents: number): string {
  return (cents / MONEY_CENTS_SCALE).toFixed(2);
}

/**
 * Splits the existing developer/DELIVERY pool.
 * Same person on both slots, or Frontend unset → Backend 100%.
 * Distinct Frontend assignee → 70/30. Remainder cents after Backend go to Frontend.
 */
export function splitDeveloperPoolAmount(
  total: string | number,
  developerId: ProductDeveloperSlotId,
  frontendDeveloperId: ProductDeveloperSlotId,
): DeveloperPoolSplit {
  const totalCents = amountToCents(total);
  if (!hasDistinctFrontendAssignee(developerId, frontendDeveloperId)) {
    return { backendAmount: centsToAmount(totalCents), frontendAmount: centsToAmount(0) };
  }

  const backendCents = Math.round((totalCents * DEVELOPER_POOL_BACKEND_PERCENT) / PERCENT_BASE);
  const frontendCents = totalCents - backendCents;
  return {
    backendAmount: centsToAmount(backendCents),
    frontendAmount: centsToAmount(frontendCents),
  };
}
