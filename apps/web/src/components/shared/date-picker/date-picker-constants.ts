/** Popover width for compact calendar (px). */
export const NBOS_DATE_PICKER_COMPACT_WIDTH_PX = 280;

/** Ghost calendar icon in dense rows — color fill only on hover / open. */
export const NBOS_DATE_PICKER_ICON_BUTTON_SHELL_CLASS = [
  'flex size-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-muted-foreground shadow-none',
  'cursor-pointer transition-colors',
  'hover:bg-muted/40 hover:text-foreground',
  'dark:bg-transparent dark:hover:bg-muted/40',
].join(' ');

export const NBOS_DATE_PICKER_ICON_BUTTON_ICON_ONLY_CLASS = 'px-0';

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

/** Placeholders inside the day / month / year cells. */
export const NBOS_TYPED_DATE_PART_PLACEHOLDERS = {
  day: '15',
  month: '12',
  year: '2026',
} as const;

export const NBOS_TYPED_DATE_YEAR_MIN = 1900;
export const NBOS_TYPED_DATE_YEAR_MAX = 2100;
export const NBOS_TYPED_DATE_TWO_DIGIT_YEAR_BASE = 2000;
