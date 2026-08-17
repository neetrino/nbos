/** Active-employee page fetched once and filtered locally in the picker. */
export const EMPLOYEE_PICKER_PAGE_SIZE = 100;

/** Cache the full active directory (picker default + typed filter). */
export const EMPLOYEE_PICKER_EMPTY_CACHE_TTL_MS = 30 * 60 * 1000;

/** Team directory list cache (default unfiltered page). */
export const TEAM_DIRECTORY_CACHE_TTL_MS = 2 * 60 * 1000;

/** Roles and departments for team filters. */
export const TEAM_FILTER_META_CACHE_TTL_MS = 10 * 60 * 1000;
