/** Layout / surface class strings for {@link TaskSheet}. */

/** Right task sheet width on sm+ (fraction of viewport). */
export const TASK_SHEET_VIEWPORT_WIDTH_FRACTION = 0.58;

/** Right task sheet — 85vw on mobile, ~58vw on sm+ (tasks list / workspace). */
export const TASK_SHEET_WIDTH_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 shadow-2xl data-[side=right]:w-[85vw] sm:max-w-none sm:data-[side=right]:w-[58vw]';

/** Anchor floating rail to the left edge of {@link TASK_SHEET_WIDTH_CLASS}. */
export const TASK_SHEET_RAIL_ANCHOR_CLASS =
  'max-sm:left-auto max-sm:right-[85vw] max-sm:translate-x-px sm:right-[58vw]';

export const TASK_SHEET_DETAIL_COLUMN_CLASS =
  'flex min-h-0 flex-1 flex-col border-border/50 bg-muted/25 xl:min-w-0 xl:border-r dark:bg-muted/15';

export const TASK_SHEET_CHAT_COLUMN_CLASS =
  'relative flex min-h-[min(70vh,28rem)] flex-1 flex-col overflow-hidden border-border/60 border-t xl:min-h-0 xl:min-w-0 xl:border-t-0 xl:border-l';

/** Stacked cards on the muted sheet canvas (Bitrix task detail). */
export const TASK_SHEET_CARD_CLASS =
  'min-w-0 rounded-xl bg-card p-3.5 shadow-sm ring-1 ring-border/50';

/** Secondary blocks (checklist, rules) — slightly softer than primary cards. */
export const TASK_SHEET_SECTION_SURFACE_CLASS =
  'min-w-0 rounded-xl bg-card/90 p-3.5 shadow-sm ring-1 ring-border/40';

/** Meta block spans the card; value columns share one width (Bitrix task detail). */
export const TASK_SHEET_META_BLOCK_CLASS =
  '@container/task-sheet-meta w-full min-w-0 max-w-full space-y-1';

/** One stacked list on a narrow pane; two columns only when the card is wide. */
export const TASK_SHEET_TEAM_COLUMNS_CLASS =
  'flex w-full min-w-0 flex-col gap-y-1 @min-[48rem]/task-sheet-meta:flex-row @min-[48rem]/task-sheet-meta:items-start @min-[48rem]/task-sheet-meta:gap-x-4';

/** Assistant / observer — flush right only in the wide two-column layout. */
export const TASK_SHEET_TEAM_RIGHT_COLUMN_CLASS =
  'min-w-0 space-y-1 @min-[48rem]/task-sheet-meta:ml-auto';

export const TASK_SHEET_TEAM_DIVIDER_CLASS =
  'bg-border hidden w-px shrink-0 self-stretch @min-[48rem]/task-sheet-meta:mx-auto @min-[48rem]/task-sheet-meta:block';

/** Team column wrapper — allows grid tracks to shrink with the split pane. */
export const TASK_SHEET_TEAM_COLUMN_CLASS = 'min-w-0';

/** Stack of outlined fields (label sits on the field border). */
export const TASK_SHEET_TEAM_META_GRID_CLASS = 'flex flex-col gap-y-3';

/** Label hugs text; used for “Linked to” and similar side captions. */
export const TASK_SHEET_META_LABEL_CLASS =
  'text-muted-foreground w-auto min-w-0 shrink-0 text-xs leading-snug @min-[48rem]/task-sheet-meta:min-w-[5.5rem]';

/** Full-width value when stacked; fixed Bitrix width only in the split layout. */
export const TASK_SHEET_META_VALUE_COLUMN_CLASS =
  'w-full min-w-0 max-w-full @min-[48rem]/task-sheet-meta:w-[15.5rem] @min-[48rem]/task-sheet-meta:shrink-0';

/** Wrapper so the field name can sit on the top border. */
export const TASK_SHEET_OUTLINED_FIELD_WRAP_CLASS = 'relative w-full min-w-0 pt-2';

/** Field name on the top edge — card fill breaks the border under the text. */
export const TASK_SHEET_OUTLINED_LABEL_CLASS =
  'bg-card text-muted-foreground pointer-events-none absolute top-2 right-3 z-10 -translate-y-1/2 px-1 text-[10px] font-medium leading-none';

/** Static value (Created) — same outline as picker shells. */
export const TASK_SHEET_OUTLINED_STATIC_SHELL_CLASS =
  'border-border/50 flex h-10 w-full min-w-0 items-center gap-1.5 rounded-xl border px-3 text-sm';
