/** Debounce before sending search to the Project Hub list API. */
export const PROJECTS_HUB_SEARCH_DEBOUNCE_MS = 320;

/** Batch size for Project Hub infinite scroll (matches API default page size). */
export const PROJECTS_HUB_PAGE_SIZE = 20;

/** Newest projects first on All / Active / Trash. */
export const PROJECTS_HUB_SORT_BY = 'createdAt' as const;
export const PROJECTS_HUB_SORT_ORDER = 'desc' as const;
