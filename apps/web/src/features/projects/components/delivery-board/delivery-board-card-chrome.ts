import type { DealTypeKey, DealTypePresentation } from '@/lib/deal-type-visual';

export type DeliveryBoardCardChrome = {
  metaIconClass: string;
  readinessPanelClass: string;
  readinessTrackClass: string;
  readinessFillClass: string;
  readinessRingTrackClass: string;
  readinessRingProgressClass: string;
  readinessAccentTextClass: string;
  readinessCheckClass: string;
  dividerClass: string;
};

const PRODUCT_CHROME: DeliveryBoardCardChrome = {
  metaIconClass: 'bg-green-500/10 text-green-600 dark:text-green-400',
  readinessPanelClass: 'border-green-200/80 dark:border-green-900/50',
  readinessTrackClass: 'bg-green-100 dark:bg-green-950/50',
  readinessFillClass: 'bg-green-500',
  readinessRingTrackClass: 'stroke-green-100 dark:stroke-green-950/60',
  readinessRingProgressClass: 'stroke-green-500',
  readinessAccentTextClass: 'text-green-600 dark:text-green-400',
  readinessCheckClass: 'text-green-600',
  dividerClass: 'border-green-200/50 dark:border-green-900/35',
};

const EXTENSION_CHROME: DeliveryBoardCardChrome = {
  metaIconClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  readinessPanelClass: 'border-orange-200/80 dark:border-orange-900/50',
  readinessTrackClass: 'bg-orange-100 dark:bg-orange-950/50',
  readinessFillClass: 'bg-orange-500',
  readinessRingTrackClass: 'stroke-orange-100 dark:stroke-orange-950/60',
  readinessRingProgressClass: 'stroke-orange-500',
  readinessAccentTextClass: 'text-orange-600 dark:text-orange-400',
  readinessCheckClass: 'text-orange-600',
  dividerClass: 'border-orange-200/50 dark:border-orange-900/35',
};

const MAINTENANCE_CHROME: DeliveryBoardCardChrome = {
  metaIconClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  readinessPanelClass: 'border-purple-200/80 dark:border-purple-900/50',
  readinessTrackClass: 'bg-purple-100 dark:bg-purple-950/50',
  readinessFillClass: 'bg-purple-500',
  readinessRingTrackClass: 'stroke-purple-100 dark:stroke-purple-950/60',
  readinessRingProgressClass: 'stroke-purple-500',
  readinessAccentTextClass: 'text-purple-600 dark:text-purple-400',
  readinessCheckClass: 'text-purple-600',
  dividerClass: 'border-purple-200/50 dark:border-purple-900/35',
};

const OUTSOURCE_CHROME: DeliveryBoardCardChrome = {
  metaIconClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  readinessPanelClass: 'border-blue-200/80 dark:border-blue-900/50',
  readinessTrackClass: 'bg-blue-100 dark:bg-blue-950/50',
  readinessFillClass: 'bg-blue-500',
  readinessRingTrackClass: 'stroke-blue-100 dark:stroke-blue-950/60',
  readinessRingProgressClass: 'stroke-blue-500',
  readinessAccentTextClass: 'text-blue-600 dark:text-blue-400',
  readinessCheckClass: 'text-blue-600',
  dividerClass: 'border-blue-200/50 dark:border-blue-900/35',
};

const NEUTRAL_CHROME: DeliveryBoardCardChrome = {
  metaIconClass: 'bg-muted text-muted-foreground',
  readinessPanelClass: 'border-border/80',
  readinessTrackClass: 'bg-muted',
  readinessFillClass: 'bg-muted-foreground',
  readinessRingTrackClass: 'stroke-muted',
  readinessRingProgressClass: 'stroke-muted-foreground',
  readinessAccentTextClass: 'text-muted-foreground',
  readinessCheckClass: 'text-muted-foreground',
  dividerClass: 'border-border/60',
};

const CHROME_BY_TYPE: Record<DealTypeKey, DeliveryBoardCardChrome> = {
  PRODUCT: PRODUCT_CHROME,
  EXTENSION: EXTENSION_CHROME,
  MAINTENANCE: MAINTENANCE_CHROME,
  OUTSOURCE: OUTSOURCE_CHROME,
};

/** Type-tinted meta icons, readiness panel, and divider for delivery kanban cards. */
export function getDeliveryBoardCardChrome(visual: DealTypePresentation): DeliveryBoardCardChrome {
  if (visual.badgeVariant === 'gray') return NEUTRAL_CHROME;
  return CHROME_BY_TYPE[visual.key];
}
