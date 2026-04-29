/** Max documents returned in one list query. */
export const DOCUMENT_LIST_LIMIT = 100;

/** Activity events returned with document detail. */
export const DOCUMENT_ACTIVITY_LIMIT = 30;

/** Global audit log (`audit_logs`) for document access changes. */
export const DOCUMENT_AUDIT_ENTITY_TYPE = 'DOCUMENT' as const;
export const DOCUMENT_AUDIT_ACTION_ACCESS_CHANGED = 'document_access_changed' as const;

export const DOCUMENT_SECTION_AUDIT_ENTITY_TYPE = 'DOCUMENT_SECTION' as const;
export const DOCUMENT_AUDIT_ACTION_SECTION_LIST_SCOPE_CHANGED =
  'document_section_list_scope_changed' as const;
