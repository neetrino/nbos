/** Stage rule in the gutter between columns (mx-2), not flush to cards. */
export const KANBAN_COLUMN_LEFT_RULE_CLASS =
  'pointer-events-none absolute bottom-0 -left-[10px] top-2.5 w-px rounded-full bg-muted-foreground/14 dark:bg-muted-foreground/22';

/** Fallback when dragged card height is not measured yet. */
export const KANBAN_DROP_PLACEHOLDER_MIN_HEIGHT_PX = 88;

/** Card-shaped drop target preview (column body only, not full-column chrome). */
export const KANBAN_DROP_PLACEHOLDER_CLASS =
  'border-primary/30 bg-primary/[0.07] min-h-[5.5rem] w-full min-w-0 rounded-xl border-2 border-dashed shadow-[inset_0_0_0_1px_rgba(46,49,146,0.08)] transition-opacity duration-200 dark:bg-primary/[0.1]';
