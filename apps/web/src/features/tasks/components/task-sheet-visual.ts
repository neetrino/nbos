/**
 * Layout and surface tokens for the task detail sheet (airy cards, balanced panes).
 */

/** Workspace column: half width next to chat on xl+. */
export const TASK_SHEET_DETAIL_COLUMN_CLASS =
  'flex min-h-0 flex-1 flex-col border-border/50 bg-background xl:min-w-0 xl:flex-1 xl:basis-1/2 xl:border-r';

/** Chat column: half width; borders only between panes on desktop. */
export const TASK_SHEET_CHAT_COLUMN_CLASS =
  'relative flex min-h-[min(70vh,28rem)] flex-1 flex-col overflow-hidden border-border/60 border-t xl:min-h-0 xl:min-w-0 xl:flex-1 xl:basis-1/2 xl:border-t-0 xl:border-l';

/** Section cards: soft ring instead of heavy borders. */
export const TASK_SHEET_SECTION_SURFACE_CLASS =
  'rounded-2xl bg-card/95 p-5 shadow-sm ring-1 ring-foreground/[0.06] backdrop-blur-[2px] dark:bg-card/75 dark:ring-white/[0.07]';
