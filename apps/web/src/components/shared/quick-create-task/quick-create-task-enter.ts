export type QuickCreateTextareaEnterAction = 'submit' | 'advance' | 'newline' | 'ignore';

export type QuickCreateTextareaEnterMode = 'title' | 'description';

/**
 * Title Enter moves focus to description (no newline).
 * Description Enter inserts a newline. Cmd/Ctrl+Enter submits both.
 */
export function resolveQuickCreateTextareaEnter(
  event: { key: string; metaKey: boolean; ctrlKey: boolean },
  mode: QuickCreateTextareaEnterMode,
): QuickCreateTextareaEnterAction {
  if (event.key !== 'Enter') return 'ignore';
  if (event.metaKey || event.ctrlKey) return 'submit';
  if (mode === 'title') return 'advance';
  return 'newline';
}
