/** Inbox title — one short headline, not a sentence. */
export const NOTIFICATION_TITLE_MAX_CHARS = 64;

/** Inbox body — one supporting line, not a message or email. */
export const NOTIFICATION_BODY_MAX_CHARS = 80;

const NOTIFICATION_COPY_ELLIPSIS = '…';

/** Collapse whitespace and cut to a one-line notification budget. */
export function clampNotificationCopy(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  const budget = Math.max(1, maxChars - NOTIFICATION_COPY_ELLIPSIS.length);
  return `${normalized.slice(0, budget).trimEnd()}${NOTIFICATION_COPY_ELLIPSIS}`;
}

export function clampNotificationTitle(title: string): string {
  return clampNotificationCopy(title, NOTIFICATION_TITLE_MAX_CHARS);
}

export function clampNotificationBody(body: string): string {
  return clampNotificationCopy(body, NOTIFICATION_BODY_MAX_CHARS);
}

export function clampNotificationFields<T extends { title: string; body: string }>(fields: T): T {
  return {
    ...fields,
    title: clampNotificationTitle(fields.title),
    body: clampNotificationBody(fields.body),
  };
}
