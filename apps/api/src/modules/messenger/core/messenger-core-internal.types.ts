import type { MessengerConversationType, MessengerLinkEntityType } from '@nbos/database';
import type { MessengerCoreConversationDto, MessengerCoreMessageDto } from './messenger-core.types';
import type { MessengerInternalSection } from './messenger-core.constants';

export type MessengerInternalConversationListItem = MessengerCoreConversationDto & {
  lastMessagePreview: string | null;
  /** True when the latest visible message was sent by the list viewer. */
  lastMessageMine: boolean;
  /** True when a peer read cursor is at or after that own latest message. */
  lastMessageSeen: boolean;
  unreadCount: number;
  peerEmployeeId: string | null;
  peerName: string | null;
  peerPosition: string | null;
  isFavorite: boolean;
  canWrite: boolean;
  pinnedMessage: { id: string; senderName: string; content: string } | null;
};

export type MessengerInternalConversationDetail = MessengerCoreConversationDto & {
  canWrite: boolean;
  primaryLinks: Array<{ entityType: MessengerLinkEntityType; entityId: string }>;
};

export type MessengerInternalListQuery = {
  section?: MessengerInternalSection;
  q?: string;
  filter?: 'unread' | 'mentions';
  unread?: boolean;
  pageSize?: number;
  cursor?: string;
};

export type MessengerInternalListResult = {
  items: MessengerInternalConversationListItem[];
  mentionsAvailable: boolean;
  hasMore: boolean;
  nextCursor?: string;
};

export function conversationCanWrite(
  editScope: string,
  participantRole: string | null,
  hasEditGrant: boolean,
): boolean {
  if (editScope === 'NONE') return false;
  if (editScope === 'ALL' || hasEditGrant) return true;
  return participantRole !== null && participantRole !== 'READ_ONLY';
}

export type MessengerInternalMessagePage = {
  items: MessengerCoreMessageDto[];
  meta: { hasMoreOlder: boolean; pageSize: number; peerLastReadAt?: string | null };
};

export const MESSENGER_INTERNAL_SECTION_TYPES: Partial<
  Record<MessengerInternalSection, readonly MessengerConversationType[]>
> = {
  groups: ['INTERNAL_GROUP'],
  direct: ['DIRECT'],
  products: ['PRODUCT'],
  tasks: ['TASK'],
  deals: ['DEAL'],
};
