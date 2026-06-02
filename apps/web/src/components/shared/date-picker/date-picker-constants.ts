/** Popover width for compact calendar (px). */
export const NBOS_DATE_PICKER_COMPACT_WIDTH_PX = 280;

/** Raised inline trigger (icon button in detail-sheet rows). */
export const NBOS_DATE_PICKER_ICON_BUTTON_SHELL_CLASS = [
  'border-border/60 bg-muted/20 text-foreground flex shrink-0 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium shadow-sm shadow-black/[0.04]',
  'transition-[box-shadow,background-color,border-color]',
  'hover:border-border hover:bg-muted/30',
  'dark:border-border/50 dark:bg-input/35 dark:hover:bg-input/45',
  'h-8 min-h-8',
].join(' ');

export const NBOS_DATE_PICKER_ICON_BUTTON_ICON_ONLY_CLASS = 'size-8 px-0';

/** Popover width for extended calendar + presets (px). */
export const NBOS_DATE_PICKER_EXTENDED_WIDTH_PX = 520;

/** Day cell size (Tailwind size-*). */
export const NBOS_DATE_PICKER_DAY_CELL_CLASS = 'size-9';

/** ISO date stored in forms (API boundary). */
export const NBOS_DATE_STORAGE_FORMAT = 'yyyy-MM-dd';

/** ISO month stored in filters (YYYY-MM). */
export const NBOS_MONTH_STORAGE_FORMAT = 'yyyy-MM';

/** Default locale for picker chrome (Bitrix-style RU labels available via prop). */
export const NBOS_DATE_PICKER_DEFAULT_LOCALE = 'en-US';
