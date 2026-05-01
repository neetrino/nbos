/** Max UTF-8 length for outbound draft subject (RFC-ish practical cap). */
export const MAIL_OUTBOUND_DRAFT_SUBJECT_MAX_LENGTH = 998;

/** Max plain-text body length for outbound drafts. */
export const MAIL_OUTBOUND_DRAFT_BODY_MAX_LENGTH = 100_000;

/** Max distinct To addresses per draft. */
export const MAIL_OUTBOUND_DRAFT_MAX_TO_RECIPIENTS = 50;

/** Max distinct Cc addresses per draft. */
export const MAIL_OUTBOUND_DRAFT_MAX_CC_RECIPIENTS = 50;

/** Max Drive FileAsset references attached to one outbound draft. */
export const MAIL_OUTBOUND_DRAFT_MAX_ATTACHMENTS = 10;
