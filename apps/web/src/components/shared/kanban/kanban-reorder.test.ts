import { describe, expect, it } from 'vitest';
import { isReorderNoop, mapFilteredInsertToFullIndex, reorderArrayAtIndex } from './kanban-reorder';

/** Same mapping KanbanBoard uses on same-column drop. */
function dropInColumn<T>(items: T[], fromIndex: number, filteredInsert: number): T[] {
  const toIndex = mapFilteredInsertToFullIndex(fromIndex, filteredInsert);
  if (isReorderNoop(fromIndex, toIndex)) return items;
  return reorderArrayAtIndex(items, fromIndex, toIndex);
}

describe('kanban same-column reorder', () => {
  const column = ['a', 'b', 'c', 'd'];

  it('moves a lower card to the top', () => {
    expect(dropInColumn(column, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('moves the top card down by one slot', () => {
    expect(dropInColumn(column, 0, 1)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('moves the top card to the bottom', () => {
    expect(dropInColumn(column, 0, 3)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('moves a middle card down one slot', () => {
    expect(dropInColumn(column, 1, 2)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('ignores a drop on the same slot or the gap directly below', () => {
    expect(dropInColumn(column, 1, 1)).toEqual(column);
    expect(isReorderNoop(1, mapFilteredInsertToFullIndex(1, 1))).toBe(true);
  });
});
