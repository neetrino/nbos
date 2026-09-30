import {
  readForwardedContent,
  readForwardedFrom,
  readForwardSourceMessageId,
} from './messenger-core-forward-meta';
import type {
  MessengerCoreMessageDto,
  MessengerCoreMessageReferenceDto,
} from './messenger-core.types';

type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderNameSnapshot: string;
  content: string;
  direction: MessengerCoreMessageDto['direction'];
  status: MessengerCoreMessageDto['status'];
  provenance: MessengerCoreMessageDto['provenance'];
  replyToMessageId: string | null;
  threadRootMessageId: string | null;
  createdAt: Date;
  editedAt: Date | null;
  attachments?: Array<{ id: string; fileAssetId: string; createdAt: Date }>;
  mentions?: Array<{ employeeId: string }>;
  metadata?: unknown;
  referencesAsTarget?: Array<{
    id: string;
    purpose: MessengerCoreMessageReferenceDto['purpose'];
    sourceMessageId: string;
    sourceConversationId: string;
    sortOrder: number;
    entityType: string | null;
    entityId: string | null;
    sourceMessage?: { senderNameSnapshot: string; content: string };
  }>;
};

export function mapCoreMessage(
  row: MessageRow,
  extras?: { mentionedEmployeeIds?: string[] },
): MessengerCoreMessageDto {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    senderName: row.senderNameSnapshot,
    content: row.content,
    direction: row.direction,
    status: row.status,
    provenance: row.provenance,
    replyToMessageId: row.replyToMessageId,
    threadRootMessageId: row.threadRootMessageId,
    createdAt: row.createdAt,
    editedAt: row.editedAt,
    attachments: (row.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      fileAssetId: attachment.fileAssetId,
      createdAt: attachment.createdAt,
    })),
    mentionedEmployeeIds:
      extras?.mentionedEmployeeIds ?? row.mentions?.map((mention) => mention.employeeId) ?? [],
    references: (row.referencesAsTarget ?? []).map((reference) => ({
      id: reference.id,
      purpose: reference.purpose,
      sourceMessageId: reference.sourceMessageId,
      sourceConversationId: reference.sourceConversationId,
      sortOrder: reference.sortOrder,
      entityType: reference.entityType,
      entityId: reference.entityId,
    })),
    forwardedFrom:
      readForwardedFrom(row.metadata) ?? firstForwardSource(row)?.senderNameSnapshot ?? null,
    forwardedContent:
      readForwardedContent(row.metadata) ?? firstForwardSource(row)?.content ?? null,
    forwardSourceMessageId:
      readForwardSourceMessageId(row.metadata) ?? firstForwardSource(row)?.sourceMessageId ?? null,
  };
}

function firstForwardSource(row: MessageRow): {
  senderNameSnapshot: string;
  content: string;
  sourceMessageId: string;
} | null {
  const ref = (row.referencesAsTarget ?? []).find((item) => item.purpose === 'FORWARD');
  if (!ref?.sourceMessage) return null;
  return {
    senderNameSnapshot: ref.sourceMessage.senderNameSnapshot,
    content: ref.sourceMessage.content,
    sourceMessageId: ref.sourceMessageId,
  };
}
