import type { MessengerConversationType, MessengerLinkEntityType } from '@nbos/database';
import type { MessengerCoreConversationDto, MessengerCoreMessageDto } from './messenger-core.types';
import type { MessengerInternalSection } from './messenger-core.constants';

export type MessengerInternalConversationListItem = MessengerCoreConversationDto & {
  lastMessagePreview: string | null;
  unreadCount: number;
  peerEmployeeId: string | null;
  peerName: string | null;
  isFavorite: boolean;
  canWrite: boolean;
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
  meta: { hasMoreOlder: boolean; pageSize: number };
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
