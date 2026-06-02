/** Minimum tile track width (px) before wrapping. Kept in sync with grid class below. */
export const CREDENTIAL_VAULT_TILE_MIN_WIDTH_PX = 240;

/** Fluid tile grid — as many columns as fit at the current width (no fixed breakpoints). */
export const CREDENTIAL_VAULT_TILE_GRID_CLASS =
  'grid gap-2 grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))]';
