import type { StatusVariant } from '@/components/shared/StatusBadge';

export type BonusPoolRiskFlag =
  | 'OVER_FUNDING'
  | 'UNDERFUNDED'
  | 'KPI_NOT_PASSED'
  | 'EARLY_RELEASE'
  | 'EXTRA_BONUS'
  | 'OVER_FUNDING_RELEASE';

const LABEL: Record<BonusPoolRiskFlag, string> = {
  OVER_FUNDING: 'Over funding',
  UNDERFUNDED: 'Underfunded',
  KPI_NOT_PASSED: 'KPI not passed',
  EARLY_RELEASE: 'Early release',
  EXTRA_BONUS: 'Extra bonus',
  OVER_FUNDING_RELEASE: 'Over-funding release',
};

const VARIANT: Record<BonusPoolRiskFlag, StatusVariant> = {
  OVER_FUNDING: 'red',
  UNDERFUNDED: 'amber',
  KPI_NOT_PASSED: 'amber',
  EARLY_RELEASE: 'blue',
  EXTRA_BONUS: 'purple',
  OVER_FUNDING_RELEASE: 'red',
};

export function bonusPoolRiskFlagUi(flag: BonusPoolRiskFlag) {
  return { label: LABEL[flag], variant: VARIANT[flag] };
}
