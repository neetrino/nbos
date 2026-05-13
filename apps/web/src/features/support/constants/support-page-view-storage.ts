/** localStorage key for Support Tickets page board vs list preference. */
export const SUPPORT_PAGE_VIEW_STORAGE_KEY = 'nbos.support.pageView';

export type SupportPageViewMode = 'kanban' | 'list';

export function readSupportPageViewFromStorage(): SupportPageViewMode {
  if (typeof window === 'undefined') return 'kanban';
  try {
    const raw = window.localStorage.getItem(SUPPORT_PAGE_VIEW_STORAGE_KEY);
    if (raw === 'list') return 'list';
    return 'kanban';
  } catch {
    return 'kanban';
  }
}

export function writeSupportPageViewToStorage(view: SupportPageViewMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SUPPORT_PAGE_VIEW_STORAGE_KEY, view);
  } catch {
    // Private mode / quota
  }
}
