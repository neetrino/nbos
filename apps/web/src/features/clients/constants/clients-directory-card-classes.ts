import { NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS } from '@/components/shared/navigable-entity-card.constants';

const CLIENTS_DIRECTORY_CARD_SHELL_CLASS =
  'border-border bg-card hover:border-accent/40 focus-visible:ring-ring flex w-full flex-col rounded-2xl border p-5 text-left focus-visible:ring-2 focus-visible:outline-none';

/** Company directory cards — wide tracks; elevated shadow reads soft. */
export const CLIENTS_DIRECTORY_CARD_CLASS = [
  CLIENTS_DIRECTORY_CARD_SHELL_CLASS,
  NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS,
].join(' ');

/** Contact profile cards — no rest shadow; soft lift + shadow on hover only. */
export const CONTACT_DIRECTORY_CARD_CLASS = [
  CLIENTS_DIRECTORY_CARD_SHELL_CLASS,
  'shadow-none transition-[transform,box-shadow] duration-[var(--motion-duration-base)] ease-[var(--motion-ease-out)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-6px_rgb(0_0_0/0.12)]',
].join(' ');

/** Large centered initials avatar on contact directory cards. */
export const CONTACT_CARD_AVATAR_CLASS =
  'bg-violet-100 text-violet-700 ring-violet-200/80 dark:bg-violet-950/50 dark:text-violet-400 dark:ring-violet-900/60 flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-bold ring-1';

/** Soft icon tile for phone / email rows. */
export const CONTACT_CARD_CONTACT_ICON_TILE_CLASS =
  'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 flex size-8 shrink-0 items-center justify-center rounded-lg';

/** Soft icon tile inside metric cells. */
export const CONTACT_CARD_METRIC_ICON_TILE_CLASS =
  'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 flex size-7 shrink-0 items-center justify-center rounded-md';

/** Bordered metric cell (projects / leads / deals). */
export const CONTACT_CARD_METRIC_CELL_CLASS =
  'border-border flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-3';

export const CONTACT_CARD_ROLE_BADGE_CLASS = 'rounded-full px-2.5 py-1 text-xs';

/** Client directory grid base — column count at `xl` depends on app sidebar width. */
const CLIENTS_DIRECTORY_CARD_GRID_BASE_CLASS =
  'grid w-full min-w-0 gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

/** 4 cards per row when sidebar is open; 5 when collapsed. */
export function clientsDirectoryCardGridClass(sidebarCollapsed: boolean): string {
  return [
    CLIENTS_DIRECTORY_CARD_GRID_BASE_CLASS,
    sidebarCollapsed ? 'xl:grid-cols-5' : 'xl:grid-cols-4',
  ].join(' ');
}
