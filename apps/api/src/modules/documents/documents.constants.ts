/** Max documents returned in one list query. */
export const DOCUMENT_LIST_LIMIT = 100;

/** Activity events per page (detail first page and activity endpoint default). */
export const DOCUMENT_ACTIVITY_PAGE_SIZE = 30;

/** Max `limit` query for `GET …/activity`. */
export const DOCUMENT_ACTIVITY_MAX_PAGE = 50;

/** Nested include fetches one extra row to set `activityNextCursor` on detail. */
export const DOCUMENT_ACTIVITY_FIRST_PAGE_TAKE = DOCUMENT_ACTIVITY_PAGE_SIZE + 1;

/** Global audit log (`audit_logs`) for document access changes. */
export const DOCUMENT_AUDIT_ENTITY_TYPE = 'DOCUMENT' as const;
export const DOCUMENT_AUDIT_ACTION_ACCESS_CHANGED = 'document_access_changed' as const;

export const DOCUMENT_SECTION_AUDIT_ENTITY_TYPE = 'DOCUMENT_SECTION' as const;
export const DOCUMENT_AUDIT_ACTION_SECTION_LIST_SCOPE_CHANGED =
  'document_section_list_scope_changed' as const;
