/** Matches API `MAIL_ATTACHMENT_MAX_BYTES` and outbound draft attachment cap. */
export const MAIL_COMPOSE_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;

export const MAIL_COMPOSE_ATTACHMENT_MAX_COUNT = 10;

/** Drive upload context for files chosen in compose. Unknown entity types skip entity ACL. */
export const MAIL_COMPOSE_UPLOAD_ENTITY_TYPE = 'EMAIL_MESSAGE';

export const MAIL_COMPOSE_UPLOAD_ENTITY_ID = 'compose';
