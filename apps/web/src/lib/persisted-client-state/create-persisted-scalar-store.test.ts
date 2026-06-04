import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { createPersistedScalarStore } from './create-persisted-scalar-store';

describe('createPersistedScalarStore', () => {
  const storageKey = 'nbos:test:scalar-view';
  const store = createPersistedScalarStore({
    storageKey,
    defaultValue: 'alpha',
    parse: (raw) => (raw === 'beta' ? 'beta' : 'alpha'),
  });

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
    expect(store.read()).toBe('alpha');
  });

  it('persists valid values', () => {
    store.write('beta');
    expect(store.read()).toBe('beta');
    expect(window.localStorage.getItem(storageKey)).toBe('beta');
  });

  it('parse ignores invalid stored values', () => {
    window.localStorage.setItem(storageKey, 'invalid');
    expect(store.read()).toBe('alpha');
  });

  it('returns a stable snapshot reference when storage is unchanged', () => {
    store.write('beta');
    const first = store.read();
    const second = store.read();
    expect(first).toBe(second);
  });

  it('dispatches change event on write', () => {
    store.write('beta');
    expect(window.dispatchEvent).toHaveBeenCalled();
  });
});
