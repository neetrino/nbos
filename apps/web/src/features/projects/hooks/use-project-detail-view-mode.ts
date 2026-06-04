'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { ProjectDetailViewMode } from '../components/project-detail-layout.constants';
import {
  getProjectDetailViewModeServerSnapshot,
  readProjectDetailViewFromStorage,
  subscribeProjectDetailViewMode,
  writeProjectDetailViewToStorage,
} from '../constants/project-detail-view-storage';

/** Persisted card/list preference for project detail products and extensions. */
export function useProjectDetailViewMode(): [
  ProjectDetailViewMode,
  (mode: ProjectDetailViewMode) => void,
] {
  const viewMode = useSyncExternalStore(
    subscribeProjectDetailViewMode,
    readProjectDetailViewFromStorage,
    getProjectDetailViewModeServerSnapshot,
  );

  const setViewMode = useCallback((mode: ProjectDetailViewMode) => {
    writeProjectDetailViewToStorage(mode);
  }, []);

  return [viewMode, setViewMode];
}
