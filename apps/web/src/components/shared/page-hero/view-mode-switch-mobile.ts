const KANBAN_SWITCHER_BOARD_VALUES = new Set([
  'BOARD',
  'board',
  'category-board',
  'kanban',
  'status',
  'compact-card',
]);

const KANBAN_SWITCHER_LIST_VALUES = new Set(['LIST', 'list', 'list-row']);

/** True when the control is a board/list toggle that mobile must not expose. */
export function isKanbanListViewSwitcher(optionValues: readonly string[]): boolean {
  let hasBoard = false;
  let hasList = false;
  for (const value of optionValues) {
    if (KANBAN_SWITCHER_BOARD_VALUES.has(value)) hasBoard = true;
    if (KANBAN_SWITCHER_LIST_VALUES.has(value)) hasList = true;
    if (hasBoard && hasList) return true;
  }
  return false;
}
