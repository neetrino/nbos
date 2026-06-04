'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';
import type { ProductCredentialsViewMode } from './product-credentials-view-options';

export const PRODUCT_CREDENTIALS_VIEW_STORAGE_KEY = 'nbos.productDetail.credentialsViewMode';

const DEFAULT_PRODUCT_CREDENTIALS_VIEW_MODE: ProductCredentialsViewMode = 'tiles';

function parseStoredViewMode(raw: string | null): ProductCredentialsViewMode {
  if (raw === 'list' || raw === 'tiles') {
    return raw;
  }
  return DEFAULT_PRODUCT_CREDENTIALS_VIEW_MODE;
}

const productCredentialsViewStore = createPersistedScalarStore<ProductCredentialsViewMode>({
  storageKey: PRODUCT_CREDENTIALS_VIEW_STORAGE_KEY,
  defaultValue: DEFAULT_PRODUCT_CREDENTIALS_VIEW_MODE,
  changeEvent: 'nbos:product-detail:credentials-view-mode-change',
  parse: parseStoredViewMode,
});

export const useProductCredentialsViewMode = productCredentialsViewStore.useValue;
