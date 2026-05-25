import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { readExpensesBoardViewMode, writeExpensesBoardViewMode } from './expenses-board-view';

describe('expenses-board-view', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      key: () => null,
      length: 0,
    };
    vi.stubGlobal('window', { localStorage: mockStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to kanban when unset', () => {
    expect(readExpensesBoardViewMode()).toBe('kanban');
  });

  it('persists list mode', () => {
    writeExpensesBoardViewMode('list');
    expect(readExpensesBoardViewMode()).toBe('list');
  });
});
