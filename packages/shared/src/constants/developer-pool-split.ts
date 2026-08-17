/** Share of the existing developer/DELIVERY pool assigned to Backend when Frontend is set. */
export const DEVELOPER_POOL_BACKEND_PERCENT = 70;
/** Share of the existing developer/DELIVERY pool assigned to Frontend when assigned. */
export const DEVELOPER_POOL_FRONTEND_PERCENT = 30;

const MONEY_CENTS_SCALE = 100;
const PERCENT_BASE = 100;

export interface DeveloperPoolSplit {
  backendAmount: string;
  frontendAmount: string;
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
 * Splits the existing developer/DELIVERY pool. Frontend unset → Backend 100%.
 * Remainder cents after the Backend share go to Frontend so parts sum to total.
 */
export function splitDeveloperPoolAmount(
  total: string | number,
  hasFrontend: boolean,
): DeveloperPoolSplit {
  const totalCents = amountToCents(total);
  if (!hasFrontend) {
    return { backendAmount: centsToAmount(totalCents), frontendAmount: centsToAmount(0) };
  }

  const backendCents = Math.round((totalCents * DEVELOPER_POOL_BACKEND_PERCENT) / PERCENT_BASE);
  const frontendCents = totalCents - backendCents;
  return {
    backendAmount: centsToAmount(backendCents),
    frontendAmount: centsToAmount(frontendCents),
  };
}
