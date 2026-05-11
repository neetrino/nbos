/** Drop-target styling — identical to KanbanBoard (Deal Pipeline). */
export const DELIVERY_KANBAN_COLUMN_DROP_ACTIVE_CLASS =
  'bg-accent/10 ring-accent/20 ring-2 ring-inset';

export const DELIVERY_KANBAN_COLUMN_TRANSITION_CLASS = 'transition-colors duration-200';

/** Task link `entityType` when creating a task tied to a project from the delivery board. */
export const DELIVERY_BOARD_TASK_LINK_PROJECT_ENTITY = 'PROJECT' as const;

/** Hex accent colors per delivery stage — used in the column header pill. */
export const DELIVERY_STAGE_HEX_COLORS = {
  STARTING: '#7C3AED',
  DEVELOPMENT: '#2563EB',
  QA: '#EA580C',
  TRANSFER: '#059669',
} as const;
