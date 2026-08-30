import type { MessengerConversationType } from '@nbos/database';
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
};

export type MessengerInternalListQuery = {
  section?: MessengerInternalSection;
  q?: string;
  filter?: 'unread' | 'mentions';
  unread?: boolean;
  pageSize?: number;
};

export type MessengerInternalListResult = {
  items: MessengerInternalConversationListItem[];
  mentionsAvailable: boolean;
};

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
