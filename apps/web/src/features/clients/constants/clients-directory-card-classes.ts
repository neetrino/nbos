const CLIENTS_DIRECTORY_CARD_SHELL_CLASS =
  'bg-card focus-visible:ring-ring flex w-full flex-col rounded-3xl p-5 text-left focus-visible:ring-2 focus-visible:outline-none';

/**
 * Soft diffuse ambient elevation (mock-aligned).
 * High blur / low opacity — no short hard layer, no negative spread rim.
 */
const CLIENTS_DIRECTORY_CARD_AMBIENT_SHADOW_CLASS =
  'shadow-[0_12px_40px_rgb(15_15_20/0.08)] transition-[transform,box-shadow] duration-[var(--motion-duration-base)] ease-[var(--motion-ease-out)] hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgb(15_15_20/0.11)]';

/** Company directory cards — soft ambient shadow, no hard border rim. */
export const COMPANY_DIRECTORY_CARD_CLASS = [
  CLIENTS_DIRECTORY_CARD_SHELL_CLASS,
  CLIENTS_DIRECTORY_CARD_AMBIENT_SHADOW_CLASS,
].join(' ');

/** Contact profile cards — no rest shadow; soft lift + shadow on hover only. */
export const CONTACT_DIRECTORY_CARD_CLASS = [
  CLIENTS_DIRECTORY_CARD_SHELL_CLASS,
  'border-border border shadow-none transition-[transform,box-shadow] duration-[var(--motion-duration-base)] ease-[var(--motion-ease-out)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-6px_rgb(0_0_0/0.12)]',
].join(' ');

/** Building icon tile on company directory cards. */
export const COMPANY_CARD_ICON_TILE_CLASS =
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 flex size-12 shrink-0 items-center justify-center rounded-2xl';

/** Soft icon tile inside metric cells. */
export const CLIENTS_DIRECTORY_METRIC_ICON_TILE_CLASS =
  'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 flex size-7 shrink-0 items-center justify-center rounded-md';

/** Bordered metric cell (projects / invoices / leads / deals). */
export const CLIENTS_DIRECTORY_METRIC_CELL_CLASS =
  'border-border flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-3';

/** Soft icon tile for phone / email rows. */
export const CONTACT_CARD_CONTACT_ICON_TILE_CLASS =
  'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 flex size-8 shrink-0 items-center justify-center rounded-lg';

export const CONTACT_CARD_METRIC_ICON_TILE_CLASS = CLIENTS_DIRECTORY_METRIC_ICON_TILE_CLASS;
export const CONTACT_CARD_METRIC_CELL_CLASS = CLIENTS_DIRECTORY_METRIC_CELL_CLASS;

export const CONTACT_CARD_ROLE_BADGE_CLASS = 'rounded-full px-2.5 py-1 text-xs';

export const COMPANY_CARD_STATUS_BADGE_CLASS = 'rounded-full px-2 py-0.5 text-[11px]';

/** Compact status chips in companies table. */
export const COMPANY_TABLE_STATUS_BADGE_CLASS = 'rounded-full px-2 text-[10px]';

/** Client directory grid — compact counts only on very large screens. */
const CLIENTS_DIRECTORY_CARD_GRID_BASE_CLASS =
  'grid w-full min-w-0 gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

/** xl: 4 cards; 2xl: 5 with sidebar open, 6 when collapsed. */
export function clientsDirectoryCardGridClass(sidebarCollapsed: boolean): string {
  return [
    CLIENTS_DIRECTORY_CARD_GRID_BASE_CLASS,
    sidebarCollapsed ? '2xl:grid-cols-6' : '2xl:grid-cols-5',
  ].join(' ');
}
