import type { ProjectDetailViewMode } from '../components/project-detail-layout.constants';

export const PROJECT_DETAIL_VIEW_STORAGE_KEY = 'nbos.projectDetail.viewMode';

export function readProjectDetailViewFromStorage(): ProjectDetailViewMode {
  if (typeof window === 'undefined') return 'card';
  try {
    const raw = window.localStorage.getItem(PROJECT_DETAIL_VIEW_STORAGE_KEY);
    if (raw === 'list') return 'list';
    return 'card';
  } catch {
    return 'card';
  }
}

export function writeProjectDetailViewToStorage(view: ProjectDetailViewMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROJECT_DETAIL_VIEW_STORAGE_KEY, view);
  } catch {
    // Private mode / quota
  }
}
