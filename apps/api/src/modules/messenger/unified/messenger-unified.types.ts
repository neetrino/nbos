export type MessengerInternalTab = 'all' | 'deal' | 'project' | 'dev' | 'tasks';

export type MessengerL1EntityType = 'PROJECT' | 'PRODUCT' | 'DEAL' | 'TASK' | 'DIRECT_BUCKET';

export interface MessengerL1EntityDto {
  entityType: MessengerL1EntityType;
  entityId: string;
  title: string;
  subtitle: string | null;
  unreadCount: number;
  /** Conversation that should open when selecting this entity (1:1 tabs). */
  primaryConversationId: string | null;
}

export interface MessengerL2ConversationDto {
  id: string;
  type: string;
  title: string;
  status: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  primaryEntityType: string | null;
  primaryEntityId: string | null;
  peerEmployeeId: string | null;
}

export interface MessengerConversationDetailDto {
  id: string;
  type: string;
  title: string;
  status: string;
  canonicalKey: string | null;
  lastMessageAt: string | null;
  primaryEntityType: string | null;
  primaryEntityId: string | null;
  peerEmployeeId: string | null;
  canSend: boolean;
}

export interface MessengerUnifiedPagedMessagesDto {
  items: Array<{
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
    attachments: Array<{ id: string; fileAssetId: string; createdAt: Date }>;
  }>;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMoreOlder?: boolean;
  };
  lastOwnMessageId: string | null;
  lastOwnMessageSeenByOthers: boolean;
  peerLastReadAt: Date | null;
}

export interface MessengerUnifiedSearchResultDto {
  conversationId: string;
  conversationType: string;
  conversationTitle: string;
  messageId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}

export const MESSENGER_L1_PAGE_SIZE = 50;
