import type {
  InputJsonValue,
  MessengerConversationType,
  MessengerConversationZone,
  MessengerLinkEntityType,
  MessengerLinkRelationType,
  MessengerMessageDirection,
  MessengerMessageProvenance,
  MessengerMessageStatus,
  MessengerParticipantRole,
  MessengerMessageReferencePurpose,
} from '@nbos/database';

export type MessengerCoreConversationDto = {
  id: string;
  zone: MessengerConversationZone;
  type: MessengerConversationType;
  title: string | null;
  status: string;
  canonicalKey: string | null;
  createdAt: Date;
  lastMessageAt: Date | null;
};

export type MessengerEntityEnsureResult = MessengerCoreConversationDto & {
  created: boolean;
  linkedLegacyConversationId: string | null;
};

export type MessengerCoreMessageDto = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderName: string;
  content: string;
  direction: MessengerMessageDirection;
  status: MessengerMessageStatus;
  provenance: MessengerMessageProvenance;
  replyToMessageId: string | null;
  threadRootMessageId: string | null;
  createdAt: Date;
  editedAt: Date | null;
  attachments: Array<{ id: string; fileAssetId: string; createdAt: Date }>;
};

export type MessengerCoreLinkInput = {
  entityType: MessengerLinkEntityType;
  entityId: string;
  relationType: MessengerLinkRelationType;
};

export type CreateMessengerCoreConversationInput = {
  zone: MessengerConversationZone;
  type: MessengerConversationType;
  createdById: string;
  title?: string;
  peerEmployeeId?: string;
  participantIds?: string[];
  links?: MessengerCoreLinkInput[];
};

export type PersistMessengerCoreMessageInput = {
  conversationId: string;
  senderId: string | null;
  content: string;
  fileAssetIds?: string[];
  replyToMessageId?: string;
  threadRootMessageId?: string;
  idempotencyKey?: string;
  direction?: MessengerMessageDirection;
  provenance?: MessengerMessageProvenance;
  senderNameSnapshot?: string;
  createdAt?: Date;
  metadata?: InputJsonValue;
};

export type CreateMessengerCoreReferenceInput = {
  sourceMessageId: string;
  referencedByMessageId?: string;
  targetMessageId?: string;
  targetEntityType?: MessengerLinkEntityType;
  targetEntityId?: string;
  purpose: MessengerMessageReferencePurpose;
  sortOrder?: number;
};

export type MessengerCoreParticipantDto = {
  employeeId: string;
  role: MessengerParticipantRole;
  leftAt: Date | null;
};
