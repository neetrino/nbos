/** Max documents returned in one list query. */
export const DOCUMENT_LIST_LIMIT = 100;

/** Max documents returned in favorites list. */
export const DOCUMENT_FAVORITES_LIMIT = 50;

/** Max documents returned in recent list. */
export const DOCUMENT_RECENT_LIMIT = 20;

/** Weight for `attachment_search_vector` rank vs body `search_vector` in list FTS. */
export const DOCUMENT_ATTACHMENT_SEARCH_RANK_WEIGHT = 0.35;

/** Activity events per page (detail first page and activity endpoint default). */
export const DOCUMENT_ACTIVITY_PAGE_SIZE = 30;

/** Max `limit` query for `GET …/activity`. */
export const DOCUMENT_ACTIVITY_MAX_PAGE = 50;

/** Nested include fetches one extra row to set `activityNextCursor` on detail. */
export const DOCUMENT_ACTIVITY_FIRST_PAGE_TAKE = DOCUMENT_ACTIVITY_PAGE_SIZE + 1;

/**
 * Valid Drive library keys for the Documents module (excludes virtual/space keys:
 * all, company, personal, shared).
 */
export const DOCUMENTS_VALID_LIBRARY_KEYS = [
  'deals',
  'projects',
  'products',
  'clients',
  'finance',
  'partners',
  'tasks',
  'support',
] as const;

export type DocumentLibraryKey = (typeof DOCUMENTS_VALID_LIBRARY_KEYS)[number];

/**
 * Library keys where only folders (not bare documents) may be created directly.
 * Documents are still allowed when linked to a specific entity (entityType + entityId)
 * or placed inside a DriveFolder (driveFolderId).
 */
export const DOCUMENTS_LIBRARY_FOLDER_ONLY_KEYS = new Set<DocumentLibraryKey>([
  'deals',
  'projects',
  'products',
  'clients',
  'finance',
  'partners',
  'tasks',
]);

/** Library keys where direct document creation (without entity or folder) is also allowed. */
export const DOCUMENTS_LIBRARY_DOCUMENT_ALLOWED_KEYS = new Set<DocumentLibraryKey>(['support']);

/** Global audit log (`audit_logs`) for document access changes. */
export const DOCUMENT_AUDIT_ENTITY_TYPE = 'DOCUMENT' as const;
export const DOCUMENT_AUDIT_ACTION_ACCESS_CHANGED = 'document_access_changed' as const;

export const DOCUMENT_SECTION_AUDIT_ENTITY_TYPE = 'DOCUMENT_SECTION' as const;
export const DOCUMENT_AUDIT_ACTION_SECTION_LIST_SCOPE_CHANGED =
  'document_section_list_scope_changed' as const;
