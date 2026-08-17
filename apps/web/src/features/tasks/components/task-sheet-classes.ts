/** Layout / surface class strings for {@link TaskSheet}. */

/** Right task sheet width on sm+ (fraction of viewport). */
export const TASK_SHEET_VIEWPORT_WIDTH_FRACTION = 0.68;

/** Right task sheet — 85vw on mobile, ~68vw on sm+ (room for detail + chat). */
export const TASK_SHEET_WIDTH_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 shadow-2xl data-[side=right]:w-[85vw] sm:max-w-none sm:data-[side=right]:w-[68vw]';

/** Anchor floating rail to the left edge of {@link TASK_SHEET_WIDTH_CLASS}. */
export const TASK_SHEET_RAIL_ANCHOR_CLASS =
  'max-sm:left-auto max-sm:right-[85vw] max-sm:translate-x-px sm:right-[68vw]';

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

/**
 * Two equal columns only when each half can hold a name + avatar without clipping.
 * Below this, fields stack full-width (typical with chat split on the detail pane).
 */
export const TASK_SHEET_TEAM_COLUMNS_CLASS =
  'grid w-full min-w-0 grid-cols-1 gap-x-4 gap-y-3 @min-[34rem]/task-sheet-meta:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] @min-[34rem]/task-sheet-meta:items-start';

/** Assistant / observer column — shares width with creator/assignee, no right flush. */
export const TASK_SHEET_TEAM_RIGHT_COLUMN_CLASS = 'min-w-0';

export const TASK_SHEET_TEAM_DIVIDER_CLASS =
  'bg-border hidden w-px shrink-0 self-stretch @min-[34rem]/task-sheet-meta:block';

/** Team column wrapper — allows grid tracks to shrink with the split pane. */
export const TASK_SHEET_TEAM_COLUMN_CLASS = 'min-w-0';

/** Stack of outlined fields (label sits on the field border). */
export const TASK_SHEET_TEAM_META_GRID_CLASS = 'flex flex-col gap-y-3';

/** Field fills its column so empty space is used instead of wrapping early. */
export const TASK_SHEET_META_VALUE_COLUMN_CLASS = 'w-full min-w-0 max-w-full';

/** Wrapper so the field name can sit on the top border. */
export {
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS as TASK_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS as TASK_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';

/** Static value (Created) — same outline as picker shells. */
export const TASK_SHEET_OUTLINED_STATIC_SHELL_CLASS =
  'border-border/50 flex h-10 w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-xl border px-3 text-sm';
