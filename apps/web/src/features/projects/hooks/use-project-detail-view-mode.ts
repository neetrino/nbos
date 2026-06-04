'use client';

import { useCallback, useState } from 'react';
import type { ProjectDetailViewMode } from '../components/project-detail-layout.constants';
import {
  readProjectDetailViewFromStorage,
  writeProjectDetailViewToStorage,
} from '../constants/project-detail-view-storage';

/** Persisted card/list preference for project detail products and extensions. */
export function useProjectDetailViewMode(): [
  ProjectDetailViewMode,
  (mode: ProjectDetailViewMode) => void,
] {
  const [viewMode, setViewModeState] = useState<ProjectDetailViewMode>(() =>
    readProjectDetailViewFromStorage(),
  );

  const setViewMode = useCallback((mode: ProjectDetailViewMode) => {
    setViewModeState(mode);
    writeProjectDetailViewToStorage(mode);
  }, []);

  return [viewMode, setViewMode];
}
