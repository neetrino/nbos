/**
 * Min card track (~448px) before the grid drops to fewer columns.
 * Wide layouts fit up to 3 columns; narrower areas step down to 2 then 1
 * instead of squeezing card proportions.
 */
export const NAVIGABLE_ENTITY_CARD_MIN_TRACK = '28rem';

/** Fluid hub-style card grid — max ~3 wide columns, wraps when space is tight. */
export const NAVIGABLE_ENTITY_CARD_GRID_CLASS =
  'grid w-full min-w-0 gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,28rem),1fr))]';

/** Elevated shadow ramp for hub/directory entity cards (rest + hover). */
export const NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS =
  'shadow-[0_8px_24px_-6px_rgb(0_0_0/0.16)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-12px_rgb(0_0_0/0.28)]';

/** Project Hub directory card — icon tile, code pill, orders pill (mock-aligned). */
export const PROJECT_HUB_CARD_SHELL_CLASS =
  'group/project-hub-card border-border bg-card flex h-full flex-col rounded-3xl border';

export const PROJECT_HUB_CARD_ICON_TILE_CLASS =
  'flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400';

export const PROJECT_HUB_CARD_CODE_PILL_CLASS =
  'inline-flex w-fit items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-tight text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400';

export const PROJECT_HUB_CARD_ORDERS_PILL_CLASS =
  'inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-foreground dark:bg-indigo-950/50';

export const PROJECT_HUB_CARD_META_ROW_CLASS =
  'text-muted-foreground inline-flex min-w-0 items-center gap-1.5 text-xs';

/** Same responsive behavior as {@link NAVIGABLE_ENTITY_CARD_GRID_CLASS}. */
export const NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS = NAVIGABLE_ENTITY_CARD_GRID_CLASS;

/** Work Spaces product tab — slightly wider cards than default hub grid. */
export const WORK_SPACE_PRODUCT_CARD_GRID_CLASS =
  'grid w-full min-w-0 gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,32rem),1fr))]';
