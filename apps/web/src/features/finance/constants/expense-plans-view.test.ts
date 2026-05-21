import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  DEFAULT_EXPENSE_PLANS_VIEW_MODE,
  readExpensePlansViewMode,
  writeExpensePlansViewMode,
} from './expense-plans-view';

describe('expense-plans-view', () => {
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

  it('defaults to grid when unset', () => {
    expect(readExpensePlansViewMode()).toBe(DEFAULT_EXPENSE_PLANS_VIEW_MODE);
  });

  it('persists list mode', () => {
    writeExpensePlansViewMode('list');
    expect(readExpensePlansViewMode()).toBe('list');
  });

  it('persists board mode', () => {
    writeExpensePlansViewMode('board');
    expect(readExpensePlansViewMode()).toBe('board');
  });
});
