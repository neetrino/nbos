/** Must match `GET /api/bonus?projectId=` (BonusController). */
export const BONUS_BOARD_PROJECT_FILTER_QUERY = 'projectId' as const;

/** Query key for opening a bonus entry releases sheet on the bonus board. */
export const BONUS_BOARD_OPEN_ENTRY_QUERY = 'openBonusEntryId' as const;

/** Shareable bonus board URL with optional project scope. */
export function bonusBoardHref(projectId?: string | null): string {
  const base = '/bonus';
  const id = projectId?.trim();
  if (!id) return base;
  const q = new URLSearchParams({ [BONUS_BOARD_PROJECT_FILTER_QUERY]: id });
  return `${base}?${q.toString()}`;
}
