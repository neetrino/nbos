import type {
  WhatsAppGatewayChatItem,
  WhatsAppGatewayChatType,
  WhatsAppGatewayChatsPage,
  WhatsAppGatewayGroupsPage,
} from '@/lib/api/whatsapp';

export const WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE = 50;

export function resolveDirectoryChatType(id: string, type?: string): WhatsAppGatewayChatType {
  if (type === 'group' || type === 'direct') return type;
  return id.endsWith('@g.us') ? 'group' : 'direct';
}

export function directoryHasMorePage(receivedCount: number, pageSize: number): boolean {
  return receivedCount >= pageSize;
}

export function groupsPageToDirectoryPage(page: WhatsAppGatewayGroupsPage): WhatsAppGatewayChatsPage {
  return {
    items: page.groups.map((group): WhatsAppGatewayChatItem => ({
      id: group.id,
      name: group.name,
      type: 'group',
    })),
    pagination: page.pagination,
  };
}
