import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  DEFAULT_PRODUCTS_HUB_PAGE_PREFERENCES,
  PRODUCTS_HUB_PAGE_STORAGE_KEY,
  readProductsHubPagePreferences,
  writeProductsHubPagePreferences,
} from './products-hub-page-preferences-storage';

describe('products-hub-page-preferences-storage', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to All and grid', () => {
    expect(readProductsHubPagePreferences()).toEqual(DEFAULT_PRODUCTS_HUB_PAGE_PREFERENCES);
  });

  it('persists a valid tab and view', () => {
    writeProductsHubPagePreferences({ activeTab: 'maintenance', viewMode: 'list' });
    expect(readProductsHubPagePreferences()).toEqual({
      activeTab: 'maintenance',
      viewMode: 'list',
    });
    expect(window.localStorage.getItem(PRODUCTS_HUB_PAGE_STORAGE_KEY)).toContain('maintenance');
  });

  it('falls back when the stored tab is unknown', () => {
    window.localStorage.setItem(
      PRODUCTS_HUB_PAGE_STORAGE_KEY,
      JSON.stringify({ activeTab: 'incoming', viewMode: 'grid' }),
    );
    expect(readProductsHubPagePreferences().activeTab).toBe('all');
  });
});
