/** Canonical Finance bonus board path (NBOS `04-Finance-Pages.md`). */
export const FINANCE_BONUS_BOARD_PATH = '/finance/bonuses' as const;

/** Legacy path; `/bonus` redirects here preserving query string. */
export const BONUS_BOARD_LEGACY_PATH = '/bonus' as const;

/** Must match `GET /api/bonus?projectId=` (BonusController). */
export const BONUS_BOARD_PROJECT_FILTER_QUERY = 'projectId' as const;

/** Query key for opening a bonus entry releases sheet on the bonus board. */
export const BONUS_BOARD_OPEN_ENTRY_QUERY = 'openBonusEntryId' as const;

/** Shareable bonus board URL with optional project scope. */
export function bonusBoardHref(projectId?: string | null): string {
  const base = FINANCE_BONUS_BOARD_PATH;
  const id = projectId?.trim();
  if (!id) return base;
  const q = new URLSearchParams({ [BONUS_BOARD_PROJECT_FILTER_QUERY]: id });
  return `${base}?${q.toString()}`;
}

/** Bonus board URL scoped to project with a specific entry sheet open. */
export function bonusEntryHref(projectId: string, bonusEntryId: string): string {
  const q = new URLSearchParams({
    [BONUS_BOARD_PROJECT_FILTER_QUERY]: projectId,
    [BONUS_BOARD_OPEN_ENTRY_QUERY]: bonusEntryId,
  });
  return `${FINANCE_BONUS_BOARD_PATH}?${q.toString()}`;
}
