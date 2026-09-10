import type { Socket } from 'socket.io';

export function readSocketToken(client: Socket): string | null {
  const fromAuth = client.handshake.auth?.token;
  if (typeof fromAuth === 'string' && fromAuth.length > 0) return fromAuth;
  const header = client.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

export function extractChannelId(body: unknown): string | null {
  return extractNonEmptyStringField(body, 'channelId');
}

export function extractRecipientId(body: unknown): string | null {
  return extractNonEmptyStringField(body, 'recipientId');
}

export function extractConversationId(body: unknown): string | null {
  return extractNonEmptyStringField(body, 'conversationId');
}

function extractNonEmptyStringField(body: unknown, field: string): string | null {
  if (!body || typeof body !== 'object') return null;
  const raw = (body as Record<string, unknown>)[field];
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  return id.length > 0 ? id : null;
}
