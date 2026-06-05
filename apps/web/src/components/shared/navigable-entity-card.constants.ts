/**
 * Min card track (~448px) before the grid drops to fewer columns.
 * Wide layouts fit up to 3 columns; narrower areas step down to 2 then 1
 * instead of squeezing card proportions.
 */
export const NAVIGABLE_ENTITY_CARD_MIN_TRACK = '28rem';

/** Fluid hub-style card grid — max ~3 wide columns, wraps when space is tight. */
export const NAVIGABLE_ENTITY_CARD_GRID_CLASS =
  'grid w-full min-w-0 gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,28rem),1fr))]';

/** Same responsive behavior as {@link NAVIGABLE_ENTITY_CARD_GRID_CLASS}. */
export const NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS = NAVIGABLE_ENTITY_CARD_GRID_CLASS;
