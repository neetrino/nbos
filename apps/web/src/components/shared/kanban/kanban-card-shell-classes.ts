export const KANBAN_CARD_SHELL_RADIUS_CLASS = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
} as const;

export const KANBAN_CARD_SHELL_PADDING_CLASS = {
  none: '',
  /** Bonus board — slightly tighter than `md`. */
  compact: 'px-3 py-2.5',
  md: 'p-3',
  lg: 'p-4',
} as const;

export const KANBAN_CARD_SHELL_BASE_SHADOW_CLASS = {
  none: '',
  sm: 'shadow-sm',
} as const;

export const KANBAN_CARD_SHELL_HOVER_SHADOW_CLASS = {
  sm: 'hover:shadow-sm',
  md: 'hover:shadow-md',
} as const;

export const KANBAN_CARD_SHELL_TRANSITION_CLASS = {
  shadow: 'transition-shadow',
  all: 'transition-all duration-200',
  colors: 'transition-colors',
} as const;

export const KANBAN_CARD_SHELL_HOVER_SURFACE_CLASS = {
  muted30: 'hover:bg-muted/30',
  muted40: 'hover:bg-muted/40',
} as const;

export type KanbanCardShellRadius = keyof typeof KANBAN_CARD_SHELL_RADIUS_CLASS;
export type KanbanCardShellPadding = keyof typeof KANBAN_CARD_SHELL_PADDING_CLASS;
export type KanbanCardShellBaseShadow = keyof typeof KANBAN_CARD_SHELL_BASE_SHADOW_CLASS;
export type KanbanCardShellHoverShadow = keyof typeof KANBAN_CARD_SHELL_HOVER_SHADOW_CLASS;
export type KanbanCardShellTransition = keyof typeof KANBAN_CARD_SHELL_TRANSITION_CLASS;
export type KanbanCardShellHoverSurface = keyof typeof KANBAN_CARD_SHELL_HOVER_SURFACE_CLASS;
