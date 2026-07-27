/**
 * Opaque cursor for notification list: createdAt DESC, id DESC.
 * Encoded as base64url JSON — not a secret, only for pagination stability.
 */
export type NotificationListCursor = {
  createdAt: string;
  id: string;
};

export function encodeNotificationCursor(cursor: NotificationListCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeNotificationCursor(raw: string): NotificationListCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const createdAt = (parsed as { createdAt?: unknown }).createdAt;
    const id = (parsed as { id?: unknown }).id;
    if (typeof createdAt !== 'string' || typeof id !== 'string') return null;
    if (Number.isNaN(Date.parse(createdAt))) return null;
    if (!id.trim()) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}
