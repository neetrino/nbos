export const CALLS_PAGE_SIZE_DEFAULT = 20;
export const CALLS_PAGE_SIZE_MAX = 100;

/** Virtual CRM activity type. Call rows stay on AtsCallEvent. */
export const CRM_ACTIVITY_TYPE_CALL = 'CALL' as const;

export const CALL_SCREEN_RECENT_LIMIT = 5;
export const CALL_NOTE_MAX_LENGTH = 4_000;
export const CALL_VIEW_FORBIDDEN_MESSAGE = 'No permission to view this call';
export const CALL_NOTE_EDIT_FORBIDDEN_MESSAGE = 'No permission to edit this call note';
export const CALL_NOTE_NOT_TERMINAL_MESSAGE = 'Call note can be saved only after the call ends';
export const CALL_NOTE_VERSION_CONFLICT_MESSAGE =
  'Call note was updated by someone else. Refresh and try again.';
export const CALL_NOTE_UPDATED_AUDIT_ACTION = 'CALL_NOTE_UPDATED';
export const CALL_LIST_FORBIDDEN_MESSAGE = 'No permission to view these calls';
export const CALL_RECORDING_UNAVAILABLE_MESSAGE = 'Call recording is not available';
