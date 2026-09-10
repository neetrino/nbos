import type { MessengerClientConversationListItem } from './messenger-core-client.types';
import type { MessengerAttentionDto } from './messenger-core-attention.types';
import {
  attentionsFromListRow,
  CLIENT_LIST_ATTENTION_INCLUDE,
} from './messenger-core-client-list-attention';
import { absoluteConversationUnreadCount } from './messenger-core-unread';

export function clientListInclude(employeeId: string) {
  return {
    messages: {
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' as const },
      take: 1,
      select: { content: true, direction: true, senderId: true, createdAt: true },
    },
    readStates: { where: { employeeId }, select: { lastReadAt: true } },
    userSettings: { where: { employeeId }, select: { favorite: true } },
    participants: {
      where: { leftAt: null, employeeId },
      select: { role: true },
    },
    externalMappings: { select: { provider: true }, take: 1 },
    links: {
      where: { entityType: 'LEAD' as const, relationType: 'PRIMARY' as const },
      select: { entityId: true },
    },
    ...CLIENT_LIST_ATTENTION_INCLUDE,
  };
}

export type ClientListRow = {
  id: string;
  zone: MessengerClientConversationListItem['zone'];
  type: MessengerClientConversationListItem['type'];
  title: string | null;
  status: string;
  canonicalKey: string | null;
  createdAt: Date;
  lastMessageAt: Date | null;
  messages: Array<{ content: string; direction: string; senderId: string | null; createdAt: Date }>;
  readStates: Array<{ lastReadAt: Date }>;
  userSettings: Array<{ favorite: boolean }>;
  participants: Array<{ role: string }>;
  externalMappings: Array<{ provider: MessengerClientConversationListItem['provider'] }>;
  links: Array<{ entityId: string }>;
  productCommunicationBindings: Parameters<typeof attentionsFromListRow>[0]['productCommunicationBindings'];
  attentions: Parameters<typeof attentionsFromListRow>[0]['attentions'];
};

export function mapClientListItem(
  row: ClientListRow,
  employeeId: string,
  clientSendScope: string,
): MessengerClientConversationListItem {
  const lastReadAt = row.readStates[0]?.lastReadAt ?? null;
  const last = row.messages[0];
  const unreadCount = absoluteConversationUnreadCount({
    viewerEmployeeId: employeeId,
    latestSenderId: last?.senderId ?? null,
    lastMessageAt: last?.createdAt ?? null,
    lastReadAt,
  });
  const role = row.participants[0]?.role ?? null;
  const attention: MessengerAttentionDto[] = attentionsFromListRow(row);
  return {
    id: row.id,
    zone: 'CLIENT',
    type: row.type,
    title: row.title,
    status: row.status,
    canonicalKey: row.canonicalKey,
    createdAt: row.createdAt,
    lastMessageAt: last?.createdAt ?? null,
    lastMessagePreview: last?.content ?? null,
    lastMessageDirection:
      last?.direction === 'INBOUND' || last?.direction === 'OUTBOUND' ? last.direction : null,
    unreadCount,
    isFavorite: row.userSettings[0]?.favorite === true,
    canSend: clientSendScope !== 'NONE' && role !== 'READ_ONLY',
    provider: row.externalMappings[0]?.provider ?? null,
    leadId: row.links[0]?.entityId ?? null,
    attention,
  };
}
