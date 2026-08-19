import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { parseSearchFilterRecord } from './parse-search-filter-record';
import {
  readPersistedSearchFilters,
  writePersistedSearchFilters,
} from './use-persisted-search-filters';

describe('parseSearchFilterRecord', () => {
  it('returns empty for invalid input', () => {
    expect(parseSearchFilterRecord(null)).toEqual({});
    expect(parseSearchFilterRecord([])).toEqual({});
    expect(parseSearchFilterRecord('x')).toEqual({});
  });

  it('keeps string entries only', () => {
    expect(parseSearchFilterRecord({ status: 'OPEN', count: 2, owner: 'u1' })).toEqual({
      status: 'OPEN',
      owner: 'u1',
    });
  });
});

describe('persisted search filter store', () => {
  beforeEach(() => {
    const storeMap: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => storeMap[key] ?? null,
      setItem: (key: string, value: string) => {
        storeMap[key] = value;
      },
      removeItem: (key: string) => {
        delete storeMap[key];
      },
      clear: () => {
        Object.keys(storeMap).forEach((k) => delete storeMap[k]);
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
    expect(readPersistedSearchFilters('test.filters.defaults', { scope: 'active' })).toEqual({
      scope: 'active',
    });
  });

  it('replaces the whole record including clear', () => {
    writePersistedSearchFilters('test.filters.replace', { status: 'OPEN', owner: 'u1' });
    expect(readPersistedSearchFilters('test.filters.replace')).toEqual({
      status: 'OPEN',
      owner: 'u1',
    });
    writePersistedSearchFilters('test.filters.replace', {});
    expect(readPersistedSearchFilters('test.filters.replace')).toEqual({});
  });

  it('ignores invalid stored JSON', () => {
    window.localStorage.setItem('nbos:search-filters:test.filters.invalid', '{not-json');
    expect(readPersistedSearchFilters('test.filters.invalid', { ok: 'yes' })).toEqual({
      ok: 'yes',
    });
  });
});
