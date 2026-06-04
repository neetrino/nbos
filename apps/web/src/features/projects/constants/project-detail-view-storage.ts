import type { ProjectDetailViewMode } from '../components/project-detail-layout.constants';

export const PROJECT_DETAIL_VIEW_STORAGE_KEY = 'nbos.projectDetail.viewMode';

const CHANGE_EVENT = 'nbos:project-detail:view-mode-change';

const VALID_VIEW_MODES = new Set<ProjectDetailViewMode>(['card', 'list']);

export const DEFAULT_PROJECT_DETAIL_VIEW_MODE: ProjectDetailViewMode = 'card';

/** Parses raw localStorage value; invalid or missing values fall back to default. */
export function parseStoredViewMode(raw: string | null): ProjectDetailViewMode {
  if (typeof raw === 'string' && VALID_VIEW_MODES.has(raw as ProjectDetailViewMode)) {
    return raw as ProjectDetailViewMode;
  }
  return DEFAULT_PROJECT_DETAIL_VIEW_MODE;
}

let cachedViewModeRaw: string | null | undefined;
let cachedViewModeSnapshot: ProjectDetailViewMode = DEFAULT_PROJECT_DETAIL_VIEW_MODE;

function getProjectDetailViewModeSnapshot(): ProjectDetailViewMode {
  if (typeof window === 'undefined') {
    return DEFAULT_PROJECT_DETAIL_VIEW_MODE;
  }
  const raw = window.localStorage.getItem(PROJECT_DETAIL_VIEW_STORAGE_KEY);
  if (raw === cachedViewModeRaw) {
    return cachedViewModeSnapshot;
  }
  cachedViewModeRaw = raw;
  cachedViewModeSnapshot = parseStoredViewMode(raw);
  return cachedViewModeSnapshot;
}

export function readProjectDetailViewFromStorage(): ProjectDetailViewMode {
  return getProjectDetailViewModeSnapshot();
}

export function writeProjectDetailViewToStorage(view: ProjectDetailViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(PROJECT_DETAIL_VIEW_STORAGE_KEY, view);
    cachedViewModeRaw = view;
    cachedViewModeSnapshot = view;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Private mode / quota
  }
}

export function subscribeProjectDetailViewMode(onStoreChange: () => void): () => void {
  const onChange = () => onStoreChange();
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function getProjectDetailViewModeServerSnapshot(): ProjectDetailViewMode {
  return DEFAULT_PROJECT_DETAIL_VIEW_MODE;
}
