import type { MessengerExternalProvider, MessengerLinkEntityType } from '@nbos/database';
import type { MessengerCoreConversationDto, MessengerCoreMessageDto } from './messenger-core.types';
import type { MessengerAttentionDto } from './messenger-core-attention.types';
import type {
  MessengerClientListFilter,
  MessengerClientProviderFilter,
  MessengerClientSection,
} from './messenger-core.constants';

export type MessengerClientConversationListItem = MessengerCoreConversationDto & {
  lastMessagePreview: string | null;
  lastMessageDirection: 'INBOUND' | 'OUTBOUND' | 'INTERNAL' | null;
  unreadCount: number;
  isFavorite: boolean;
  canSend: boolean;
  provider: MessengerExternalProvider | null;
  leadId: string | null;
  attention: MessengerAttentionDto[];
};

export type MessengerClientConversationDetail = MessengerCoreConversationDto & {
  canSend: boolean;
  canWrite: boolean;
  provider: MessengerExternalProvider | null;
  primaryLinks: Array<{ entityType: MessengerLinkEntityType; entityId: string }>;
  attention: MessengerAttentionDto[];
};

export type MessengerClientListQuery = {
  section?: MessengerClientSection;
  q?: string;
  filter?: MessengerClientListFilter;
  provider?: MessengerClientProviderFilter;
  pageSize?: number;
};

export type MessengerClientListResult = {
  items: MessengerClientConversationListItem[];
};

export type MessengerClientMessagePage = {
  items: MessengerCoreMessageDto[];
  meta: { hasMoreOlder: boolean; pageSize: number };
};
