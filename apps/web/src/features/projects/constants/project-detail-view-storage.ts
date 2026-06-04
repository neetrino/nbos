'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';
import type { ProjectDetailViewMode } from '../components/project-detail-layout.constants';

export const PROJECT_DETAIL_VIEW_STORAGE_KEY = 'nbos.projectDetail.viewMode';

export const DEFAULT_PROJECT_DETAIL_VIEW_MODE: ProjectDetailViewMode = 'card';

function parseStoredViewMode(raw: string | null): ProjectDetailViewMode {
  if (raw === 'list' || raw === 'card') {
    return raw;
  }
  return DEFAULT_PROJECT_DETAIL_VIEW_MODE;
}

const projectDetailViewStore = createPersistedScalarStore<ProjectDetailViewMode>({
  storageKey: PROJECT_DETAIL_VIEW_STORAGE_KEY,
  defaultValue: DEFAULT_PROJECT_DETAIL_VIEW_MODE,
  changeEvent: 'nbos:project-detail:view-mode-change',
  parse: parseStoredViewMode,
});

export const readProjectDetailViewFromStorage = projectDetailViewStore.read;
export const writeProjectDetailViewToStorage = projectDetailViewStore.write;
export const useProjectDetailViewMode = projectDetailViewStore.useValue;
