import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';

export type BonusPoolLedgerStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PARTIALLY_RELEASED'
  | 'CLOSED'
  | 'UNKNOWN';

const BONUS_POOL_STATUS_LABEL: Record<BonusPoolLedgerStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PARTIALLY_RELEASED: 'Partial release',
  CLOSED: 'Closed',
  UNKNOWN: 'No ledger',
};

const BONUS_POOL_STATUS_VARIANT: Record<BonusPoolLedgerStatus, StatusVariant> = {
  DRAFT: 'zinc',
  ACTIVE: 'blue',
  PARTIALLY_RELEASED: 'amber',
  CLOSED: 'green',
  UNKNOWN: 'gray',
};

export function normalizeBonusPoolLedgerStatus(raw: string | null): BonusPoolLedgerStatus {
  if (!raw) return 'UNKNOWN';
  const upper = raw.toUpperCase();
  if (upper === 'DRAFT') return 'DRAFT';
  if (upper === 'ACTIVE') return 'ACTIVE';
  if (upper === 'PARTIALLY_RELEASED') return 'PARTIALLY_RELEASED';
  if (upper === 'CLOSED') return 'CLOSED';
  return 'UNKNOWN';
}

export function bonusPoolStatusUi(status: string | null) {
  const key = normalizeBonusPoolLedgerStatus(status);
  return {
    label: BONUS_POOL_STATUS_LABEL[key],
    variant: BONUS_POOL_STATUS_VARIANT[key],
  };
}

export function bonusPoolHasOverFunding(row: BonusProductPoolRow): boolean {
  return parseBonusPoolAmount(row.ledgerOverFundingAmount) > 0;
}

/** Full-row list styling — over funding overrides ledger status tint. */
export const BONUS_POOL_STATUS_LIST_ROW_CLASS: Record<BonusPoolLedgerStatus, string> = {
  DRAFT:
    'bg-muted/40 text-zinc-800 hover:bg-muted/55 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-700',
  ACTIVE:
    'bg-blue-100 text-blue-900 hover:bg-blue-200/90 dark:bg-blue-900/40 dark:text-blue-100 dark:hover:bg-blue-900/55',
  PARTIALLY_RELEASED:
    'bg-amber-100 text-amber-900 hover:bg-amber-200/90 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/55',
  CLOSED:
    'bg-green-100 text-green-900 hover:bg-green-200/90 dark:bg-green-900/40 dark:text-green-100 dark:hover:bg-green-900/55',
  UNKNOWN:
    'bg-muted/30 text-zinc-700 hover:bg-muted/45 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:bg-zinc-700',
};

const BONUS_POOL_OVER_FUNDING_ROW_CLASS =
  'bg-red-100 text-red-950 hover:bg-red-200/90 dark:bg-red-950/45 dark:text-red-100 dark:hover:bg-red-900/55';

export function bonusPoolListRowClass(row: BonusProductPoolRow): string {
  if (bonusPoolHasOverFunding(row)) {
    return BONUS_POOL_OVER_FUNDING_ROW_CLASS;
  }
  const status = normalizeBonusPoolLedgerStatus(row.ledgerPoolStatus);
  return BONUS_POOL_STATUS_LIST_ROW_CLASS[status];
}
