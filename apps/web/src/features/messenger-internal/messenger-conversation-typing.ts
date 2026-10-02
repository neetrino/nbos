export type ConversationTypingPeer = {
  conversationId: string;
  employeeId: string;
  label: string;
};

export function parseConversationTyping(payload: unknown): ConversationTypingPeer | null {
  if (!payload || typeof payload !== 'object') return null;
  const row = payload as Record<string, unknown>;
  const conversationId = readId(row.conversationId);
  const employeeId = readId(row.employeeId);
  const label = typeof row.label === 'string' ? row.label.trim() : '';
  if (!conversationId || !employeeId || !label) return null;
  return { conversationId, employeeId, label };
}

function readId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const id = value.trim();
  return id.length > 0 ? id : null;
}
