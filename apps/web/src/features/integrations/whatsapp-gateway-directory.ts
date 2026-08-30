import type { WhatsAppGatewayChatType } from '@/lib/api/whatsapp';

export const WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE = 20;

export function resolveDirectoryChatType(id: string, type?: string): WhatsAppGatewayChatType {
  if (type === 'group' || type === 'direct') return type;
  return id.endsWith('@g.us') ? 'group' : 'direct';
}

export function directoryHasMorePage(receivedCount: number, pageSize: number): boolean {
  return receivedCount >= pageSize;
}
