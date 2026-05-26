/** Opaque card fill for header tab connector (matches hero card). */
export const MODULE_SHELL_BRIDGE_FILL = 'bg-card';

/** Card surface — standard module hero (CRM and Finance PageHero). */
export const MODULE_SHELL_SURFACE_BASE = 'border-border/70';

export const MODULE_SHELL_SURFACE_CARD = `${MODULE_SHELL_SURFACE_BASE} bg-card/80 rounded-2xl border px-4 py-3 shadow-sm`;

/** Pull PageHero toward the topbar on routes without a header tab bridge. */
export const PAGE_HERO_HEADER_OFFSET = '-mt-2';

/** Pull linked shell toward header context tab connector (Finance, payroll). */
export const MODULE_SHELL_BRIDGE_HERO_PULL = '-mt-5';

/** Space between header tab connector and PageHero card (linked layout). */
export const MODULE_SHELL_BRIDGE_HERO_GAP = 'mt-0';
