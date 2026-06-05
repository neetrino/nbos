'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';
import type { SupportPageViewMode } from './support-page-view-options';

/** localStorage key for Support Tickets page board vs list preference. */
export const SUPPORT_PAGE_VIEW_STORAGE_KEY = 'nbos.support.pageView';

export const DEFAULT_SUPPORT_PAGE_VIEW_MODE: SupportPageViewMode = 'kanban';

const supportPageViewStore = createPersistedScalarStore<SupportPageViewMode>({
  storageKey: SUPPORT_PAGE_VIEW_STORAGE_KEY,
  defaultValue: DEFAULT_SUPPORT_PAGE_VIEW_MODE,
  changeEvent: 'nbos:support:page-view-change',
  parse: (raw) => (raw === 'list' ? 'list' : 'kanban'),
});

export const readSupportPageViewFromStorage = supportPageViewStore.read;
export const writeSupportPageViewToStorage = supportPageViewStore.write;
export const useSupportPageViewMode = supportPageViewStore.useValue;
