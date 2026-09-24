/** Popover width for compact calendar (px). */
export const NBOS_DATE_PICKER_COMPACT_WIDTH_PX = 280;

/** Calendar icon in dense rows — no fill; icon turns blue on hover. */
export const NBOS_DATE_PICKER_ICON_BUTTON_SHELL_CLASS = [
  'flex size-8 shrink-0 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground shadow-none',
  'cursor-pointer transition-colors',
  'hover:bg-transparent hover:text-sky-600',
  'data-popup-open:bg-transparent data-popup-open:text-sky-600',
  'dark:bg-transparent dark:hover:bg-transparent dark:hover:text-sky-400',
  'dark:data-popup-open:bg-transparent dark:data-popup-open:text-sky-400',
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
