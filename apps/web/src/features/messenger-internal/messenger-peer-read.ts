export type ConversationPeerRead = {
  conversationId: string;
  readerId: string;
  lastReadAt: string;
};

export function parseConversationPeerRead(payload: unknown): ConversationPeerRead | null {
  if (!payload || typeof payload !== 'object') return null;
  const row = payload as Record<string, unknown>;
  if (!isId(row.conversationId) || !isId(row.readerId) || !isInstant(row.lastReadAt)) return null;
  return {
    conversationId: row.conversationId,
    readerId: row.readerId,
    lastReadAt: row.lastReadAt,
  };
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isInstant(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}
