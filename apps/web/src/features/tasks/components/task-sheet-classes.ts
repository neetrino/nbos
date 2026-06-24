/** Layout / surface class strings for {@link TaskSheet}. */

/** Right task sheet width on sm+ (fraction of viewport). */
export const TASK_SHEET_VIEWPORT_WIDTH_FRACTION = 0.65;

/** Right task sheet — ~65vw on sm+ (tasks list / workspace). */
export const TASK_SHEET_WIDTH_CLASS =
  'flex w-full flex-col gap-0 p-0 shadow-2xl ring-1 ring-black/5 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[65vw] dark:ring-white/10';

/** Anchor floating rail to the left edge of {@link TASK_SHEET_WIDTH_CLASS}. */
export const TASK_SHEET_RAIL_ANCHOR_CLASS = 'sm:right-[65vw]';

export const TASK_SHEET_DETAIL_COLUMN_CLASS =
  'flex min-h-0 flex-1 flex-col border-border/50 bg-muted/25 xl:min-w-0 xl:border-r dark:bg-muted/15';

export const TASK_SHEET_CHAT_COLUMN_CLASS =
  'relative flex min-h-[min(70vh,28rem)] flex-1 flex-col overflow-hidden border-border/60 border-t xl:min-h-0 xl:min-w-0 xl:border-t-0 xl:border-l';

/** White stacked cards on the muted sheet canvas (Bitrix task detail). */
export const TASK_SHEET_CARD_CLASS =
  'min-w-0 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-black/[0.05] dark:bg-card dark:ring-white/[0.07]';

/** Secondary blocks (checklist, rules) — slightly softer than primary cards. */
export const TASK_SHEET_SECTION_SURFACE_CLASS =
  'min-w-0 rounded-xl bg-white/90 p-3.5 shadow-sm ring-1 ring-black/[0.04] dark:bg-card/80 dark:ring-white/[0.06]';

/** Meta block spans the card; value columns share one width (Bitrix task detail). */
export const TASK_SHEET_META_BLOCK_CLASS =
  '@container/task-sheet-meta w-full min-w-0 max-w-full space-y-1';

/** Stacks on narrow sheet; hugs content in row mode (no 1fr dead space). */
export const TASK_SHEET_TEAM_COLUMNS_CLASS =
  'flex w-full min-w-0 flex-col gap-y-3 @min-[42rem]/task-sheet-meta:flex-row @min-[42rem]/task-sheet-meta:items-start @min-[42rem]/task-sheet-meta:gap-x-4';

/** Assistant / observer — only pushed to card edge when extra width remains. */
export const TASK_SHEET_TEAM_RIGHT_COLUMN_CLASS =
  'min-w-0 space-y-1 @min-[42rem]/task-sheet-meta:ml-auto';

export const TASK_SHEET_TEAM_DIVIDER_CLASS =
  'bg-border hidden w-px shrink-0 self-stretch @min-[42rem]/task-sheet-meta:mx-auto @min-[42rem]/task-sheet-meta:block';

/** Team column wrapper — allows grid tracks to shrink with the split pane. */
export const TASK_SHEET_TEAM_COLUMN_CLASS = 'min-w-0';

/** Shared label/value columns for Creator · Assignee · Deadline rows. */
export const TASK_SHEET_TEAM_META_GRID_CLASS =
  'space-y-1 @min-[42rem]/task-sheet-meta:grid @min-[42rem]/task-sheet-meta:grid-cols-[auto_minmax(0,15.5rem)] @min-[42rem]/task-sheet-meta:items-center @min-[42rem]/task-sheet-meta:gap-x-3 @min-[42rem]/task-sheet-meta:gap-y-1 @min-[42rem]/task-sheet-meta:space-y-0';

/** Label hugs text; shared min width keeps rows aligned without a fixed 8.25rem gap. */
export const TASK_SHEET_META_LABEL_CLASS =
  'text-muted-foreground w-auto min-w-[5.5rem] shrink-0 text-xs leading-snug';

/** Fixed value width (Bitrix task detail); shrinks only when pane is narrower than 15.5rem. */
export const TASK_SHEET_META_VALUE_COLUMN_CLASS = 'w-[15.5rem] min-w-0 max-w-full shrink-0';
