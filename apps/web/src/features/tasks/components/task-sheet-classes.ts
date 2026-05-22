/** Layout / surface class strings for {@link TaskSheet}. */

export const TASK_SHEET_DETAIL_COLUMN_CLASS =
  'flex min-h-0 flex-1 flex-col border-border/50 bg-muted/25 xl:min-w-0 xl:flex-1 xl:basis-1/2 xl:border-r dark:bg-muted/15';

export const TASK_SHEET_CHAT_COLUMN_CLASS =
  'relative flex min-h-[min(70vh,28rem)] flex-1 flex-col overflow-hidden border-border/60 border-t xl:min-h-0 xl:min-w-0 xl:flex-1 xl:basis-1/2 xl:border-t-0 xl:border-l';

/** White stacked cards on the muted sheet canvas (Bitrix task detail). */
export const TASK_SHEET_CARD_CLASS =
  'rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-black/[0.05] dark:bg-card dark:ring-white/[0.07]';

/** Secondary blocks (checklist, rules) — slightly softer than primary cards. */
export const TASK_SHEET_SECTION_SURFACE_CLASS =
  'rounded-xl bg-white/90 p-3.5 shadow-sm ring-1 ring-black/[0.04] dark:bg-card/80 dark:ring-white/[0.06]';

export const TASK_SHEET_CARD_TITLE_CLASS =
  'text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase';
