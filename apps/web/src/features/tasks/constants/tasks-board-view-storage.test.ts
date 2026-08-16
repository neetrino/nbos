import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  DEFAULT_TASKS_BOARD_VIEW,
  TASKS_BOARD_VIEW_STORAGE_KEY,
  parseTasksBoardView,
  readTasksBoardViewMode,
  writeTasksBoardViewMode,
} from './tasks-board-view-storage';

describe('tasks-board-view-storage', () => {
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
    vi.stubGlobal('window', {
      localStorage: mockStorage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to kanban when unset', () => {
    expect(readTasksBoardViewMode()).toBe(DEFAULT_TASKS_BOARD_VIEW);
  });

  it('persists selectable board modes', () => {
    writeTasksBoardViewMode('my-plan');
    expect(readTasksBoardViewMode()).toBe('my-plan');
    expect(window.localStorage.getItem(TASKS_BOARD_VIEW_STORAGE_KEY)).toBe('my-plan');

    writeTasksBoardViewMode('deadline');
    expect(readTasksBoardViewMode()).toBe('deadline');
  });

  it('ignores planning and unknown stored values', () => {
    expect(parseTasksBoardView('planning')).toBe('kanban');
    expect(parseTasksBoardView('design')).toBe('kanban');
    window.localStorage.setItem(TASKS_BOARD_VIEW_STORAGE_KEY, 'planning');
    expect(readTasksBoardViewMode()).toBe('kanban');
  });
});
