export const WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE = 20;

export function whatsappDirectoryItemKind(id: string): 'group' | 'chat' {
  return id.endsWith('@g.us') ? 'group' : 'chat';
}

export function directoryHasMorePage(receivedCount: number, pageSize: number): boolean {
  return receivedCount >= pageSize;
}
