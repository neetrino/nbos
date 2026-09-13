import type { BonusReleaseType } from '@/lib/api/bonus';

type ReleaseBadgeVariant = 'blue' | 'gray' | 'orange' | 'purple' | 'red' | 'amber';

/** English fallback labels; prefer `BONUS_RELEASE_TYPE_MESSAGE_KEY` at render. */
export const BONUS_RELEASE_TYPE_LABEL: Record<BonusReleaseType, string> = {
  AUTO: 'Auto',
  MANUAL: 'Manual',
  EARLY: 'Early',
  EXTRA: 'Extra',
  OVER_FUNDING: 'Over funding',
  CORRECTION: 'Correction',
};

export const BONUS_RELEASE_TYPE_MESSAGE_KEY: Record<
  BonusReleaseType,
  | 'compensation.bonus.releaseType.AUTO'
  | 'compensation.bonus.releaseType.MANUAL'
  | 'compensation.bonus.releaseType.EARLY'
  | 'compensation.bonus.releaseType.EXTRA'
  | 'compensation.bonus.releaseType.OVER_FUNDING'
  | 'compensation.bonus.releaseType.CORRECTION'
> = {
  AUTO: 'compensation.bonus.releaseType.AUTO',
  MANUAL: 'compensation.bonus.releaseType.MANUAL',
  EARLY: 'compensation.bonus.releaseType.EARLY',
  EXTRA: 'compensation.bonus.releaseType.EXTRA',
  OVER_FUNDING: 'compensation.bonus.releaseType.OVER_FUNDING',
  CORRECTION: 'compensation.bonus.releaseType.CORRECTION',
};

export const BONUS_RELEASE_TYPE_UI: Record<
  BonusReleaseType,
  {
    labelKey: (typeof BONUS_RELEASE_TYPE_MESSAGE_KEY)[BonusReleaseType];
    label: string;
    variant: ReleaseBadgeVariant;
    isWarning: boolean;
  }
> = {
  AUTO: {
    labelKey: BONUS_RELEASE_TYPE_MESSAGE_KEY.AUTO,
    label: BONUS_RELEASE_TYPE_LABEL.AUTO,
    variant: 'blue',
    isWarning: false,
  },
  MANUAL: {
    labelKey: BONUS_RELEASE_TYPE_MESSAGE_KEY.MANUAL,
    label: BONUS_RELEASE_TYPE_LABEL.MANUAL,
    variant: 'gray',
    isWarning: false,
  },
  EARLY: {
    labelKey: BONUS_RELEASE_TYPE_MESSAGE_KEY.EARLY,
    label: BONUS_RELEASE_TYPE_LABEL.EARLY,
    variant: 'orange',
    isWarning: true,
  },
  EXTRA: {
    labelKey: BONUS_RELEASE_TYPE_MESSAGE_KEY.EXTRA,
    label: BONUS_RELEASE_TYPE_LABEL.EXTRA,
    variant: 'purple',
    isWarning: true,
  },
  OVER_FUNDING: {
    labelKey: BONUS_RELEASE_TYPE_MESSAGE_KEY.OVER_FUNDING,
    label: BONUS_RELEASE_TYPE_LABEL.OVER_FUNDING,
    variant: 'red',
    isWarning: true,
  },
  CORRECTION: {
    labelKey: BONUS_RELEASE_TYPE_MESSAGE_KEY.CORRECTION,
    label: BONUS_RELEASE_TYPE_LABEL.CORRECTION,
    variant: 'amber',
    isWarning: true,
  },
};
