import { isWhatsAppChatId } from './messenger-wa-identity';

export type WhatsAppSendCommandPayload = {
  accountId: string;
  chatId: string;
};

export function parseWhatsAppSendCommandPayload(
  payload: unknown,
): WhatsAppSendCommandPayload | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const accountId = typeof record.accountId === 'string' ? record.accountId.trim() : '';
  const chatId = typeof record.chatId === 'string' ? record.chatId.trim() : '';
  if (!accountId || !isWhatsAppChatId(chatId)) return null;
  return { accountId, chatId };
}

export function whatsAppSendCommandPayloadsMatch(
  left: WhatsAppSendCommandPayload,
  right: WhatsAppSendCommandPayload,
): boolean {
  return left.accountId === right.accountId && left.chatId === right.chatId;
}
