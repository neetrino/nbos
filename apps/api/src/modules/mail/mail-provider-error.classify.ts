export type MailProviderErrorClass = 'transient' | 'auth' | 'permanent' | 'ambiguous';

const TRANSIENT_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'EHOSTUNREACH',
]);

const AUTH_PATTERNS = [
  /invalid_grant/i,
  /unauthorized/i,
  /authentication failed/i,
  /imap auth/i,
  /invalid_client/i,
  /token revoked/i,
  /needs_reconnect/i,
];

const PERMANENT_PATTERNS = [
  /5\.1\.1/,
  /user unknown/i,
  /mailbox unavailable/i,
  /recipient.*rejected/i,
  /invalid mailbox/i,
  /no such user/i,
  /address rejected/i,
];

const AMBIGUOUS_PATTERNS = [/timeout after submit/i, /accepted.*no response/i];

/** Thrown when the provider likely accepted the message but the outcome is unknown. */
export class MailAmbiguousSendError extends Error {
  readonly name = 'MailAmbiguousSendError';

  constructor(message: string) {
    super(message);
  }
}

/** Thrown when outbound FileAsset bytes cannot be loaded; BullMQ should retry. */
export class MailAttachmentLoadError extends Error {
  readonly name = 'MailAttachmentLoadError';

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

/** Permanent inbound-attachment failure (missing part, unusable provider id). */
export class MailAttachmentPermanentError extends Error {
  readonly name = 'MailAttachmentPermanentError';

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

function readErrorField(error: unknown, key: string): string {
  if (typeof error !== 'object' || error === null || !(key in error)) {
    return '';
  }
  const value = (error as Record<string, unknown>)[key];
  return value === undefined || value === null ? '' : String(value);
}

function extractHttpStatus(error: unknown): number | undefined {
  const direct = Number(readErrorField(error, 'status') || readErrorField(error, 'code'));
  if (Number.isInteger(direct) && direct >= 100 && direct <= 599) {
    return direct;
  }
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: unknown } }).response;
    const nested = Number(response?.status);
    if (Number.isInteger(nested) && nested >= 100 && nested <= 599) {
      return nested;
    }
  }
  return undefined;
}

/** Maps a provider/SMTP/Gmail error to the Mail send retry class. */
export function classifyMailProviderError(error: unknown): MailProviderErrorClass {
  if (error instanceof MailAmbiguousSendError) {
    return 'ambiguous';
  }
  if (error instanceof MailAttachmentPermanentError) {
    return 'permanent';
  }
  if (error instanceof MailAttachmentLoadError) {
    return 'transient';
  }
  const message = error instanceof Error ? error.message : String(error);
  const code = readErrorField(error, 'code');
  const status = extractHttpStatus(error);
  if (AMBIGUOUS_PATTERNS.some((pattern) => pattern.test(message))) {
    return 'ambiguous';
  }
  if (
    status === 401 ||
    AUTH_PATTERNS.some((pattern) => pattern.test(message) || pattern.test(code))
  ) {
    return 'auth';
  }
  if (PERMANENT_PATTERNS.some((pattern) => pattern.test(message))) {
    return 'permanent';
  }
  if (status === 429 || (status !== undefined && status >= 500)) {
    return 'transient';
  }
  if (TRANSIENT_CODES.has(code) || /timeout|econnreset|etimedout|socket hang up/i.test(message)) {
    return 'transient';
  }
  return 'transient';
}
