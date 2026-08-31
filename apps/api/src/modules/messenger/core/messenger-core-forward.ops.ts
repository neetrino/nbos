import { type InputJsonValue } from '@nbos/database';
import { persistCoreMessage } from './messenger-core-message.ops';
import { createCoreMessageReference } from './messenger-core-reference.ops';
import { loadOrderedSourceMessages } from './messenger-core-source-load';
import { MESSENGER_CORE_FORWARD_PREVIEW_MAX_LENGTH } from './messenger-core.constants';
import type { MessengerCoreMessageDto } from './messenger-core.types';
import type { PrismaClient } from '@nbos/database';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function persistForwardHolderAndReferences(
  prisma: PrismaLike,
  input: {
    targetConversationId: string;
    senderId: string;
    sourceMessageIds: string[];
  },
): Promise<{
  holder: MessengerCoreMessageDto;
  sourceIds: string[];
  createdConversation: false;
}> {
  const sources = await loadOrderedSourceMessages(prisma, input.sourceMessageIds);
  const holder = await persistCoreMessage(
    prisma,
    {
      conversationId: input.targetConversationId,
      senderId: input.senderId,
      content: forwardPreviewContent(sources),
      metadata: forwardMetadata(sources),
    },
    [],
  );
  await createForwardReferences(prisma, input.senderId, holder.id, sources);
  return { holder, sourceIds: sources.map((row) => row.id), createdConversation: false };
}

function forwardPreviewContent(sources: Array<{ content: string }>): string {
  const first = sources[0]?.content.trim() ?? '';
  if (sources.length === 1) return truncatePreview(first);
  return `Forwarded ${sources.length} messages`;
}

function truncatePreview(content: string): string {
  if (content.length <= MESSENGER_CORE_FORWARD_PREVIEW_MAX_LENGTH) return content;
  return `${content.slice(0, MESSENGER_CORE_FORWARD_PREVIEW_MAX_LENGTH)}…`;
}

function forwardMetadata(sources: Array<{ id: string }>): InputJsonValue {
  return {
    messageAction: {
      kind: 'FORWARD',
      sourceMessageIds: sources.map((row) => row.id),
    },
  };
}

async function createForwardReferences(
  prisma: PrismaLike,
  createdById: string,
  holderMessageId: string,
  sources: Array<{ id: string }>,
): Promise<void> {
  for (const [index, source] of sources.entries()) {
    await createCoreMessageReference(prisma, {
      sourceMessageId: source.id,
      targetMessageId: holderMessageId,
      purpose: 'FORWARD',
      sortOrder: index,
      createdById,
    });
  }
}
