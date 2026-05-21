import {
  MODULE_SHELL_BRIDGE_FILL,
  MODULE_SHELL_SURFACE_BASE,
} from '@/components/shared/module-shell/module-shell-surface';

/** Horizontal scroll when module context exceeds available width. */
export const HEADER_CONTEXT_SCROLL =
  'min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

/** Tab row; line only under inactive zones (active tab overlaps this border). */
export const HEADER_CONTEXT_TAB_ROW =
  'border-border/70 inline-flex h-full min-h-0 w-max min-w-0 items-end gap-0.5 border-b sm:gap-1';

/** Inactive zone tab — sits on the bar, not connected to the page shell. */
export const HEADER_CONTEXT_TAB_INACTIVE =
  'text-muted-foreground hover:text-foreground mb-1.5 inline-flex items-center rounded-t-lg px-3 py-2 text-[15px] font-semibold tracking-tight whitespace-nowrap transition-colors hover:bg-muted/60 sm:px-4 sm:text-base';

/**
 * Active zone tab — same fill as bridged PageHero; covers tab-row border beneath it.
 */
export const HEADER_CONTEXT_TAB_ACTIVE = [
  MODULE_SHELL_SURFACE_BASE,
  MODULE_SHELL_BRIDGE_FILL,
  'border-border/70 relative z-20 -mb-px inline-flex items-center rounded-t-xl border border-b-0 px-4 py-2.5',
  'text-foreground text-[15px] font-bold tracking-tight whitespace-nowrap sm:text-base',
].join(' ');
