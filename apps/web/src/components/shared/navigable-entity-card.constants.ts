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

/** Same responsive behavior as {@link NAVIGABLE_ENTITY_CARD_GRID_CLASS}. */
export const NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS = NAVIGABLE_ENTITY_CARD_GRID_CLASS;
