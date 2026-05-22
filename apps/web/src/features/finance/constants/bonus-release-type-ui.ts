import type { BonusReleaseType } from '@/lib/api/bonus';

type ReleaseBadgeVariant = 'blue' | 'gray' | 'orange' | 'purple' | 'red' | 'amber';

export const BONUS_RELEASE_TYPE_UI: Record<
  BonusReleaseType,
  { label: string; variant: ReleaseBadgeVariant; isWarning: boolean }
> = {
  AUTO: { label: 'Auto', variant: 'blue', isWarning: false },
  MANUAL: { label: 'Manual', variant: 'gray', isWarning: false },
  EARLY: { label: 'Early', variant: 'orange', isWarning: true },
  EXTRA: { label: 'Extra', variant: 'purple', isWarning: true },
  OVER_FUNDING: { label: 'Over funding', variant: 'red', isWarning: true },
  CORRECTION: { label: 'Correction', variant: 'amber', isWarning: true },
};
