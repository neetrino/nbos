/** Must match `GET /api/bonus?projectId=` (BonusController). */
export const BONUS_BOARD_PROJECT_FILTER_QUERY = 'projectId' as const;

/** Shareable bonus board URL with optional project scope. */
export function bonusBoardHref(projectId?: string | null): string {
  const base = '/bonus';
  const id = projectId?.trim();
  if (!id) return base;
  const q = new URLSearchParams({ [BONUS_BOARD_PROJECT_FILTER_QUERY]: id });
  return `${base}?${q.toString()}`;
}
