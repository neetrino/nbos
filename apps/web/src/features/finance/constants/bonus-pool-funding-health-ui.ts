import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { BonusProductPoolRow } from '@/lib/api/bonus';

export type BonusPoolFundingHealth = 'EMPTY' | 'PARTIAL' | 'READY' | 'OVER' | 'CLOSED' | 'UNKNOWN';

const LABEL: Record<BonusPoolFundingHealth, string> = {
  EMPTY: 'Empty',
  PARTIAL: 'Partial',
  READY: 'Ready',
  OVER: 'Over funded',
  CLOSED: 'Closed',
  UNKNOWN: 'Unknown',
};

const VARIANT: Record<BonusPoolFundingHealth, StatusVariant> = {
  EMPTY: 'zinc',
  PARTIAL: 'amber',
  READY: 'green',
  OVER: 'red',
  CLOSED: 'blue',
  UNKNOWN: 'gray',
};

const FILL_BAR_CLASS: Record<BonusPoolFundingHealth, string> = {
  EMPTY: 'bg-zinc-400 dark:bg-zinc-500',
  PARTIAL: 'bg-amber-500',
  READY: 'bg-emerald-500',
  OVER: 'bg-red-500',
  CLOSED: 'bg-blue-500',
  UNKNOWN: 'bg-muted-foreground/40',
};

export function bonusPoolFundingHealthUi(health: BonusPoolFundingHealth) {
  return {
    label: LABEL[health],
    variant: VARIANT[health],
    fillBarClass: FILL_BAR_CLASS[health],
  };
}

export function resolveRowFundingHealth(row: BonusProductPoolRow): BonusPoolFundingHealth {
  return row.fundingHealth ?? 'UNKNOWN';
}

export function formatPoolFillPercent(value: number | null): string {
  if (value == null) return '—';
  return `${value}%`;
}
