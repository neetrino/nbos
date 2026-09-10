import { describe, expect, it } from 'vitest';
import { isKanbanListViewSwitcher } from './view-mode-switch-mobile';

describe('isKanbanListViewSwitcher', () => {
  it('detects board/list dual views used on kanban pages', () => {
    expect(isKanbanListViewSwitcher(['kanban', 'list'])).toBe(true);
    expect(isKanbanListViewSwitcher(['board', 'list', 'employee'])).toBe(true);
    expect(isKanbanListViewSwitcher(['BOARD', 'LIST'])).toBe(true);
    expect(isKanbanListViewSwitcher(['status', 'list', 'months'])).toBe(true);
    expect(isKanbanListViewSwitcher(['category-board', 'list', 'tiles'])).toBe(true);
  });

  it('ignores card/grid switchers that are not kanban', () => {
    expect(isKanbanListViewSwitcher(['grid', 'list'])).toBe(false);
    expect(isKanbanListViewSwitcher(['tiles', 'list', 'folders'])).toBe(false);
    expect(isKanbanListViewSwitcher(['compact-card', 'list-row'])).toBe(false);
  });
});
