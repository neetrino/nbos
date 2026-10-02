import { BadRequestException } from '@nestjs/common';
import type { InputJsonValue, PrismaClient } from '@nbos/database';
import { persistCoreMessage } from './messenger-core-message.ops';
import { createCoreMessageReference } from './messenger-core-reference.ops';
import { loadOrderedSourceMessages } from './messenger-core-source-load';
import { MESSENGER_CORE_FORWARD_PREVIEW_MAX_LENGTH } from './messenger-core.constants';
import { forwardActionMetadata } from './messenger-core-forward-meta';
import { runMessengerWriteTx } from './messenger-core-revision-tx';
import type { MessengerCoreMessageDto } from './messenger-core.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

type SourceRow = {
  id: string;
  conversationId: string;
  content: string;
  senderNameSnapshot: string;
};

export async function persistForwardHolderAndReferences(
  prisma: PrismaLike,
  input: {
    targetConversationId: string;
    senderId: string;
    sourceMessageIds: string[];
    comment?: string;
  },
): Promise<{
  holder: MessengerCoreMessageDto;
  holders: MessengerCoreMessageDto[];
  sourceIds: string[];
  createdConversation: false;
  commentMessage: MessengerCoreMessageDto | null;
}> {
  const sources = await loadOrderedSourceMessages(prisma, input.sourceMessageIds);
  const comment = input.comment?.trim() ?? '';
  const holders: MessengerCoreMessageDto[] = [];
  for (const [index, source] of sources.entries()) {
    const isLast = index === sources.length - 1;
    holders.push(
      await persistOneForward(prisma, input, source, isLast && comment ? comment : null),
    );
  }
  const holder = holders[0];
  if (!holder) {
    throw new BadRequestException('Select at least one source message');
  }
  return {
    holder,
    holders,
    sourceIds: sources.map((row) => row.id),
    createdConversation: false,
    commentMessage: null,
  };
}

async function persistOneForward(
  prisma: PrismaLike,
  input: { targetConversationId: string; senderId: string },
  source: SourceRow,
  comment: string | null,
): Promise<MessengerCoreMessageDto> {
  const fromName = source.senderNameSnapshot.trim() || 'Message';
  const original = truncatePreview(source.content.trim()) || 'Message';
  return runMessengerWriteTx(prisma, async (tx) => {
    const holder = await persistCoreMessage(
      tx,
      {
        conversationId: input.targetConversationId,
        senderId: input.senderId,
        content: comment ?? original,
        metadata: jsonMetadata(source.id, fromName, original),
      },
      [],
    );
    const reference = await createCoreMessageReference(tx, {
      sourceMessageId: source.id,
      targetMessageId: holder.id,
      purpose: 'FORWARD',
      sortOrder: 0,
      createdById: input.senderId,
    });
    return {
      ...holder,
      forwardedFrom: fromName,
      forwardedContent: original,
      forwardSourceMessageId: source.id,
      references: [
        {
          id: reference.id,
          purpose: 'FORWARD',
          sourceMessageId: source.id,
          sourceConversationId: source.conversationId,
          sortOrder: 0,
          entityType: null,
          entityId: null,
        },
      ],
    };
  });
}

function jsonMetadata(sourceId: string, fromName: string, fromContent: string): InputJsonValue {
  return JSON.parse(
    JSON.stringify(forwardActionMetadata([sourceId], fromName, fromContent)),
  ) as InputJsonValue;
}

function truncatePreview(content: string): string {
  if (content.length <= MESSENGER_CORE_FORWARD_PREVIEW_MAX_LENGTH) return content;
  return `${content.slice(0, MESSENGER_CORE_FORWARD_PREVIEW_MAX_LENGTH)}…`;
}
