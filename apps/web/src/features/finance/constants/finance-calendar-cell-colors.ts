/**
 * Shared calendar month-cell palette — same tokens as `/finance/salary`
 * ({@link SALARY_LINE_STATUS_CALENDAR_CELL_CLASS}).
 */
export const FINANCE_CALENDAR_CELL_AMBER =
  'border-amber-200/80 bg-amber-100 text-amber-900 hover:bg-amber-200/70 dark:border-amber-800/50 dark:bg-amber-900/35 dark:text-amber-200 dark:hover:bg-amber-900/50';

export const FINANCE_CALENDAR_CELL_BLUE =
  'border-blue-200/80 bg-blue-100 text-blue-900 hover:bg-blue-200/70 dark:border-blue-800/50 dark:bg-blue-900/35 dark:text-blue-200 dark:hover:bg-blue-900/50';

export const FINANCE_CALENDAR_CELL_ORANGE =
  'border-orange-200/80 bg-orange-100 text-orange-900 hover:bg-orange-200/70 dark:border-orange-800/50 dark:bg-orange-900/35 dark:text-orange-200 dark:hover:bg-orange-900/50';

export const FINANCE_CALENDAR_CELL_GREEN =
  'border-green-200/80 bg-green-100 text-green-900 hover:bg-green-200/70 dark:border-green-800/50 dark:bg-green-900/35 dark:text-green-200 dark:hover:bg-green-900/50';

export const FINANCE_CALENDAR_CELL_MUTED =
  'border-zinc-300/80 bg-muted/40 text-zinc-800 hover:bg-muted/60 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-700';

export const FINANCE_CALENDAR_CELL_EMPTY =
  'border-border bg-muted/20 text-muted-foreground flex items-center justify-center rounded-md border border-dashed text-xs';

/** Opaque sticky header chrome (salary / plans / subscriptions). */
export const FINANCE_CALENDAR_STICKY_SURFACE_CLASS = 'bg-muted';

/** Sticky Total column surface — white/card, not muted chrome. */
export const FINANCE_CALENDAR_TOTAL_STICKY_SURFACE_CLASS = 'bg-background';

/**
 * Sticky Month total cells — opaque + box-shadow seals so `border-collapse`
 * seams do not let row content show through while scrolling.
 */
export const FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS =
  'sticky bottom-0 bg-muted [box-shadow:0_-2px_0_0_var(--color-muted),0_2px_0_0_var(--color-muted),-2px_0_0_0_var(--color-muted),2px_0_0_0_var(--color-muted)]';

/** Month total amount card — violet accent on muted footer chrome. */
export const FINANCE_CALENDAR_MONTH_TOTAL_CARD_CLASS =
  'flex items-center justify-center truncate rounded-md border border-violet-200/80 bg-violet-100 px-0.5 text-sm font-bold text-violet-900 tabular-nums dark:border-violet-800/50 dark:bg-violet-900/35 dark:text-violet-200';

/** Scrollable calendar shell — scroll works, scrollbar stays hidden. */
export const FINANCE_CALENDAR_SCROLL_SHELL_CLASS =
  'border-border min-h-0 flex-1 overflow-auto rounded-xl border [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
