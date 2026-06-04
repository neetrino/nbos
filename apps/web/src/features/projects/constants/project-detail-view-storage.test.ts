import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  DEFAULT_PROJECT_DETAIL_VIEW_MODE,
  PROJECT_DETAIL_VIEW_STORAGE_KEY,
  parseStoredViewMode,
  readProjectDetailViewFromStorage,
  writeProjectDetailViewToStorage,
} from './project-detail-view-storage';

describe('project-detail-view-storage', () => {
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

  it('defaults when unset', () => {
    expect(readProjectDetailViewFromStorage()).toBe(DEFAULT_PROJECT_DETAIL_VIEW_MODE);
  });

  it('persists list view mode', () => {
    writeProjectDetailViewToStorage('list');
    expect(readProjectDetailViewFromStorage()).toBe('list');
    expect(window.localStorage.getItem(PROJECT_DETAIL_VIEW_STORAGE_KEY)).toBe('list');
  });

  it('parseStoredViewMode ignores invalid values', () => {
    expect(parseStoredViewMode(null)).toBe(DEFAULT_PROJECT_DETAIL_VIEW_MODE);
    expect(parseStoredViewMode('invalid')).toBe(DEFAULT_PROJECT_DETAIL_VIEW_MODE);
    expect(parseStoredViewMode('')).toBe(DEFAULT_PROJECT_DETAIL_VIEW_MODE);
  });

  it('read ignores invalid stored values', () => {
    window.localStorage.setItem(PROJECT_DETAIL_VIEW_STORAGE_KEY, 'invalid');
    expect(readProjectDetailViewFromStorage()).toBe(DEFAULT_PROJECT_DETAIL_VIEW_MODE);
  });

  it('returns a stable snapshot reference when storage is unchanged', () => {
    writeProjectDetailViewToStorage('list');
    const first = readProjectDetailViewFromStorage();
    const second = readProjectDetailViewFromStorage();
    expect(first).toBe(second);
  });

  it('dispatches change event on write', () => {
    writeProjectDetailViewToStorage('list');
    expect(window.dispatchEvent).toHaveBeenCalled();
  });
});
