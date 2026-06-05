'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';
import type { SupportPageViewMode } from './support-page-view-options';

/** localStorage key for Change Control board vs list preference. */
export const SUPPORT_CHANGE_CONTROL_PAGE_VIEW_STORAGE_KEY = 'nbos.support.changeControl.pageView';

export const DEFAULT_SUPPORT_CHANGE_CONTROL_PAGE_VIEW_MODE: SupportPageViewMode = 'kanban';

const changeControlPageViewStore = createPersistedScalarStore<SupportPageViewMode>({
  storageKey: SUPPORT_CHANGE_CONTROL_PAGE_VIEW_STORAGE_KEY,
  defaultValue: DEFAULT_SUPPORT_CHANGE_CONTROL_PAGE_VIEW_MODE,
  changeEvent: 'nbos:support:change-control:page-view-change',
  parse: (raw) => (raw === 'list' ? 'list' : 'kanban'),
});

export const useSupportChangeControlPageViewMode = changeControlPageViewStore.useValue;
