import {
  DOCS_SIDEBAR_WIDTH_DEFAULT_PX,
  DOCS_SIDEBAR_WIDTH_MAX_PX,
  DOCS_SIDEBAR_WIDTH_MIN_PX,
  DOCS_SIDEBAR_RESIZE_STORAGE_KEY,
} from './documents-sidebar-resize-constants';

export function clampDocumentsSidebarWidth(width: number): number {
  return Math.min(DOCS_SIDEBAR_WIDTH_MAX_PX, Math.max(DOCS_SIDEBAR_WIDTH_MIN_PX, width));
}

export function readStoredDocumentsSidebarWidth(): number {
  if (typeof window === 'undefined') return DOCS_SIDEBAR_WIDTH_DEFAULT_PX;
  try {
    const raw = window.localStorage.getItem(DOCS_SIDEBAR_RESIZE_STORAGE_KEY);
    if (raw == null) return DOCS_SIDEBAR_WIDTH_DEFAULT_PX;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return DOCS_SIDEBAR_WIDTH_DEFAULT_PX;
    return clampDocumentsSidebarWidth(parsed);
  } catch {
    return DOCS_SIDEBAR_WIDTH_DEFAULT_PX;
  }
}

export function persistDocumentsSidebarWidth(width: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DOCS_SIDEBAR_RESIZE_STORAGE_KEY, String(width));
  } catch {
    /* storage unavailable */
  }
}
