import type { DashboardNote } from '@/lib/api/dashboard';

export const DASHBOARD_NOTE_CREATED_EVENT = 'nbos:dashboard-note-created';

export type DashboardNoteCreatedDetail = {
  note: DashboardNote;
};

/** Notify dashboard (and other listeners) that a note was saved elsewhere (e.g. header). */
export function dispatchDashboardNoteCreated(note: DashboardNote): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<DashboardNoteCreatedDetail>(DASHBOARD_NOTE_CREATED_EVENT, {
      detail: { note },
    }),
  );
}

/** Subscribe to notes created outside the dashboard page. */
export function subscribeDashboardNoteCreated(listener: (note: DashboardNote) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handler = (event: Event) => {
    const custom = event as CustomEvent<DashboardNoteCreatedDetail>;
    const note = custom.detail?.note;
    if (note) listener(note);
  };

  window.addEventListener(DASHBOARD_NOTE_CREATED_EVENT, handler);
  return () => window.removeEventListener(DASHBOARD_NOTE_CREATED_EVENT, handler);
}
