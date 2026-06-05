/** Matches {@link RelationPickerField} default max results. */
export const EMPLOYEE_PICKER_PAGE_SIZE = 20;

/** Cache only the empty-query first page (picker default list). */
export const EMPLOYEE_PICKER_EMPTY_CACHE_TTL_MS = 30 * 60 * 1000;

/** Team directory list cache (default unfiltered page). */
export const TEAM_DIRECTORY_CACHE_TTL_MS = 2 * 60 * 1000;

/** Roles and departments for team filters. */
export const TEAM_FILTER_META_CACHE_TTL_MS = 10 * 60 * 1000;
