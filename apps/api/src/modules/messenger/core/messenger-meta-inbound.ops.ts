import { PrismaClient, type MessengerMessageDirection } from '@nbos/database';
import { persistCoreMessage } from './messenger-core-message.ops';
import type { MessengerCoreMessageDto } from './messenger-core.types';
import { metaMessageLegacyIdentity } from './messenger-legacy-identity';
import { metaInboundIdempotencyKey } from './messenger-meta-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type MetaInboundMessageInput = {
  conversationId: string;
  providerMessageKey: string;
  content: string;
  senderName: string;
  direction: MessengerMessageDirection;
  createdAt: Date;
};

export type MetaInboundPersistResult = {
  message: MessengerCoreMessageDto;
  created: boolean;
};

export async function persistMetaInboundCoreMessage(
  prisma: PrismaLike,
  input: MetaInboundMessageInput,
): Promise<{ messageId: string; created: boolean }> {
  const result = await prisma.$transaction((tx) =>
    persistMetaInboundCoreMessageTx(tx as never, input),
  );
  return { messageId: result.message.id, created: result.created };
}

export async function persistMetaInboundCoreMessageTx(
  prisma: PrismaLike,
  input: MetaInboundMessageInput,
): Promise<MetaInboundPersistResult> {
  const identity = metaMessageLegacyIdentity(input.providerMessageKey);
  const already = await prisma.messengerLegacyIdentity.findUnique({
    where: { sourceKind_sourceId: identity },
    select: { messageId: true },
  });
  if (already?.messageId) {
    return { message: existingMetaInboundDto(already.messageId, input), created: false };
  }
  const message = await persistCoreMessage(prisma, metaCorePersistInput(input), []);
  await prisma.messengerLegacyIdentity.upsert({
    where: { sourceKind_sourceId: identity },
    create: { ...identity, conversationId: input.conversationId, messageId: message.id },
    update: { conversationId: input.conversationId, messageId: message.id },
  });
  return { message, created: true };
}

function metaCorePersistInput(input: MetaInboundMessageInput) {
  return {
    conversationId: input.conversationId,
    senderId: null,
    senderNameSnapshot: input.senderName,
    content: input.content,
    direction: input.direction,
    provenance: 'PROVIDER' as const,
    createdAt: input.createdAt,
    idempotencyKey: metaInboundIdempotencyKey(input.providerMessageKey),
    metadata: { providerMessageKey: input.providerMessageKey },
  };
}

function existingMetaInboundDto(
  messageId: string,
  input: MetaInboundMessageInput,
): MessengerCoreMessageDto {
  return {
    id: messageId,
    conversationId: input.conversationId,
    senderId: null,
    senderName: input.senderName,
    content: input.content,
    direction: input.direction,
    status: 'SENT',
    provenance: 'PROVIDER',
    replyToMessageId: null,
    threadRootMessageId: null,
    createdAt: input.createdAt,
    editedAt: null,
    attachments: [],
    mentionedEmployeeIds: [],
    references: [],
  };
}
