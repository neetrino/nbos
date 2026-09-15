import { describe, expect, it, vi } from 'vitest';
import {
  allowKanbanHtml5Drop,
  isSameKanbanInsert,
  planKanbanHtml5Drop,
  prepareKanbanHtml5Drag,
} from './kanban-html5-drag';

describe('planKanbanHtml5Drop', () => {
  const getItemId = (id: string) => id;
  const columnItems = ['a', 'b', 'c'];

  it('moves a card to another column using the last insert index', () => {
    expect(
      planKanbanHtml5Drop({
        dragItem: { id: 'a', fromColumn: 'today' },
        toColumn: 'this-week',
        filteredInsert: 1,
        columnItems: ['x', 'y'],
        getItemId,
      }),
    ).toEqual({
      kind: 'move',
      itemId: 'a',
      fromColumn: 'today',
      toColumn: 'this-week',
      toIndex: 1,
    });
  });

  it('reorders inside the same column', () => {
    expect(
      planKanbanHtml5Drop({
        dragItem: { id: 'c', fromColumn: 'today' },
        toColumn: 'today',
        filteredInsert: 0,
        columnItems,
        getItemId,
      }),
    ).toEqual({ kind: 'reorder', itemId: 'c', columnKey: 'today', toIndex: 0 });
  });

  it('ignores a drop on the same slot', () => {
    expect(
      planKanbanHtml5Drop({
        dragItem: { id: 'b', fromColumn: 'today' },
        toColumn: 'today',
        filteredInsert: 1,
        columnItems,
        getItemId,
      }),
    ).toEqual({ kind: 'noop' });
  });
});

describe('kanban html5 dataTransfer', () => {
  it('writes a payload so Safari and Firefox still fire drop', () => {
    const setData = vi.fn();
    const dataTransfer = { setData, effectAllowed: 'none' } as unknown as DataTransfer;
    prepareKanbanHtml5Drag(dataTransfer, 'task-1');
    expect(setData).toHaveBeenCalledWith('text/plain', 'task-1');
    expect(dataTransfer.effectAllowed).toBe('move');
  });

  it('marks the current dragover as a move drop', () => {
    const dataTransfer = { dropEffect: 'none' } as DataTransfer;
    allowKanbanHtml5Drop(dataTransfer);
    expect(dataTransfer.dropEffect).toBe('move');
  });

  it('detects an unchanged insert preview', () => {
    expect(isSameKanbanInsert({ columnKey: 'today', index: 2 }, 'today', 2)).toBe(true);
    expect(isSameKanbanInsert({ columnKey: 'today', index: 2 }, 'this-week', 2)).toBe(false);
  });
});
