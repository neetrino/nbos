/** Opaque card fill for header tab ↔ PageHero bridge (avoids seam through translucency). */
export const MODULE_SHELL_BRIDGE_FILL = 'bg-card';

/** Card surface shared by header bridge tabs and PageHero (keep border token in sync). */
export const MODULE_SHELL_SURFACE_BASE = 'border-border/70';

export const MODULE_SHELL_SURFACE_CARD = `${MODULE_SHELL_SURFACE_BASE} bg-card/80 rounded-2xl border px-4 py-3 shadow-sm`;

/** PageHero when the active header tab bridges into the shell. */
export const MODULE_SHELL_SURFACE_BRIDGED = [
  MODULE_SHELL_SURFACE_BASE,
  MODULE_SHELL_BRIDGE_FILL,
  'rounded-t-none rounded-b-2xl border-x border-b border-t-0 px-4 py-3',
  'shadow-[0_4px_12px_-2px_rgb(0_0_0/0.06)]',
  '-mt-px',
].join(' ');

/** Pull module shell up to meet the header tab (cancels AppLayout main `p-6` top). */
export const MODULE_SHELL_HEADER_BRIDGE_OFFSET = '-mt-6';
