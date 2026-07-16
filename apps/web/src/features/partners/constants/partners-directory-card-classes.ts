import { NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS } from '@/components/shared/navigable-entity-card.constants';

/** Partner directory card shell — mock-aligned elevated profile card. */
export const PARTNERS_DIRECTORY_CARD_CLASS = [
  'border-border bg-card hover:border-accent/40 focus-visible:ring-ring group flex w-full flex-col rounded-2xl border p-5 text-left focus-visible:ring-2 focus-visible:outline-none',
  NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS,
].join(' ');

export const PARTNER_CARD_AVATAR_CLASS =
  'flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-200/80 dark:bg-violet-950/50 dark:text-violet-400 dark:group-hover:bg-violet-950/70';

export const PARTNER_CARD_STAT_ICON_TILE_GREEN_CLASS =
  'flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';

export const PARTNER_CARD_STAT_ICON_TILE_MUTED_CLASS =
  'flex size-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-stone-800/60 dark:text-stone-400';

export const PARTNER_CARD_STATUS_BADGE_CLASS = 'rounded-full px-2.5 py-1 text-xs';

/** Partner directory grid base — column count at `xl` depends on app sidebar width. */
const PARTNERS_DIRECTORY_CARD_GRID_BASE_CLASS =
  'grid w-full min-w-0 gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

/** 4 cards per row when sidebar is open; 5 when collapsed. */
export function partnersDirectoryCardGridClass(sidebarCollapsed: boolean): string {
  return [
    PARTNERS_DIRECTORY_CARD_GRID_BASE_CLASS,
    sidebarCollapsed ? 'xl:grid-cols-5' : 'xl:grid-cols-4',
  ].join(' ');
}
