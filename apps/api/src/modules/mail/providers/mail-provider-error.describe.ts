const PROVIDER_ERROR_DETAIL_MAX_LENGTH = 180;
const PROVIDER_ERROR_CAUSE_DEPTH = 3;

/**
 * User-facing IMAP/SMTP failure text. ImapFlow hides the server line behind
 * "Command failed"; the useful text is `responseText`.
 */
export function describeMailProviderError(error: unknown): string {
  const message = readErrorMessage(error);
  if (isAuthenticationFailure(error)) {
    return readProviderErrorDetail(error) ?? message;
  }
  const detail = readProviderErrorDetail(error);
  if (!detail || message.includes(detail)) {
    return message;
  }
  return `${message}: ${detail}`;
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }
  return 'unknown error';
}

function isAuthenticationFailure(error: unknown, depth = 0): boolean {
  const record = readErrorRecord(error);
  if (!record || depth > PROVIDER_ERROR_CAUSE_DEPTH) {
    return false;
  }
  if (record.authenticationFailed === true) {
    return true;
  }
  return isAuthenticationFailure(record.cause, depth + 1);
}

function readProviderErrorDetail(error: unknown, depth = 0): string | null {
  const record = readErrorRecord(error);
  if (!record || depth > PROVIDER_ERROR_CAUSE_DEPTH) {
    return null;
  }
  const text = firstText(record.responseText) ?? firstText(record.response);
  if (text) {
    return clipDetail(text);
  }
  return readProviderErrorDetail(record.cause, depth + 1);
}

function readErrorRecord(error: unknown): Record<string, unknown> | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  return error as Record<string, unknown>;
}

function firstText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function clipDetail(text: string): string {
  if (text.length <= PROVIDER_ERROR_DETAIL_MAX_LENGTH) {
    return text;
  }
  return text.slice(0, PROVIDER_ERROR_DETAIL_MAX_LENGTH);
}
