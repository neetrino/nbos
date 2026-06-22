import { MODULE_SHELL_SURFACE_CARD } from '@/components/shared/module-shell/module-shell-surface';

/** Drive-style hero card surface. */
export const PAGE_HERO_SURFACE = MODULE_SHELL_SURFACE_CARD;

/** Horizontal scroll when zone tabs exceed available width (hidden scrollbar; scroll via trackpad/drag). */
export const PAGE_HERO_TAB_SCROLL =
  'min-w-0 max-w-full overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

/** Pill group container (tabs, view mode). */
export const PAGE_HERO_PILL_GROUP = 'bg-muted/70 inline-flex items-center gap-0.5 rounded-full p-1';
