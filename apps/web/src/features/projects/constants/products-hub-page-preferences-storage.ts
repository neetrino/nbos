'use client';

import { createPersistedJsonStore } from '@/lib/persisted-client-state';
import { PRODUCT_HUB_TABS } from './projects';

export type ProductsHubTab = (typeof PRODUCT_HUB_TABS)[number]['value'];
export type ProductsHubViewMode = 'grid' | 'list';

export type ProductsHubPagePreferences = {
  activeTab: ProductsHubTab;
  viewMode: ProductsHubViewMode;
};

export const PRODUCTS_HUB_PAGE_STORAGE_KEY = 'nbos.productsHub.pagePreferences';

export const DEFAULT_PRODUCTS_HUB_PAGE_PREFERENCES: ProductsHubPagePreferences = {
  activeTab: 'all',
  viewMode: 'grid',
};

const VALID_TABS = new Set<ProductsHubTab>(PRODUCT_HUB_TABS.map((tab) => tab.value));

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object';
}

function parseProductsHubPreferences(raw: string | null): ProductsHubPagePreferences {
  if (!raw) return { ...DEFAULT_PRODUCTS_HUB_PAGE_PREFERENCES };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...DEFAULT_PRODUCTS_HUB_PAGE_PREFERENCES };
    const activeTab = parsed.activeTab;
    const viewMode = parsed.viewMode;
    return {
      activeTab:
        typeof activeTab === 'string' && VALID_TABS.has(activeTab as ProductsHubTab)
          ? (activeTab as ProductsHubTab)
          : DEFAULT_PRODUCTS_HUB_PAGE_PREFERENCES.activeTab,
      viewMode:
        viewMode === 'grid' || viewMode === 'list'
          ? viewMode
          : DEFAULT_PRODUCTS_HUB_PAGE_PREFERENCES.viewMode,
    };
  } catch {
    return { ...DEFAULT_PRODUCTS_HUB_PAGE_PREFERENCES };
  }
}

const productsHubPageStore = createPersistedJsonStore<ProductsHubPagePreferences>({
  storageKey: PRODUCTS_HUB_PAGE_STORAGE_KEY,
  defaultValue: DEFAULT_PRODUCTS_HUB_PAGE_PREFERENCES,
  changeEvent: 'nbos:products-hub:page-preferences-change',
  parse: parseProductsHubPreferences,
});

export const readProductsHubPagePreferences = productsHubPageStore.read;
export const writeProductsHubPagePreferences = productsHubPageStore.write;
export const useProductsHubPagePreferences = productsHubPageStore.useValue;
