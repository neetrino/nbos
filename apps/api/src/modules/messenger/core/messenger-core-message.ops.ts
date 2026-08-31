import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { snapshotMessengerSenderName } from '../messenger-prisma-message.mapper';
import { persistCoreMessageMentions } from './messenger-core-mention.ops';
import { mapCoreMessage } from './messenger-core-message-map';
import { assertMessageDirectionForZone, defaultDirectionForZone } from './messenger-core-zone';
import type {
  MessengerCoreMessageDto,
  PersistMessengerCoreMessageInput,
} from './messenger-core.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function persistCoreMessage(
  prisma: PrismaLike,
  input: PersistMessengerCoreMessageInput,
  fileAssetIds: string[],
): Promise<MessengerCoreMessageDto> {
  if (input.idempotencyKey) {
    const existing = await prisma.messengerMessage.findUnique({
      where: {
        conversationId_idempotencyKey: {
          conversationId: input.conversationId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      include: { attachments: true, mentions: true, referencesAsTarget: true },
    });
    if (existing) return mapCoreMessage(existing);
  }
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: input.conversationId },
    select: { id: true, zone: true },
  });
  if (!conversation) {
    throw new BadRequestException('Message requires an existing conversation');
  }
  const direction = input.direction ?? defaultDirectionForZone(conversation.zone);
  assertMessageDirectionForZone(conversation.zone, direction);
  await assertOptionalReply(prisma, input.conversationId, input.replyToMessageId);
  const snapshot = await resolveSenderSnapshot(prisma, input);
  const created = await prisma.messengerMessage.create({
    data: coreMessageCreateData(conversation.id, input, snapshot, fileAssetIds, direction),
    include: { attachments: true },
  });
  await prisma.messengerConversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: created.createdAt },
  });
  const mentionedEmployeeIds = await persistCoreMessageMentions(
    prisma,
    created.id,
    input.mentionedEmployeeIds,
  );
  return mapCoreMessage(created, { mentionedEmployeeIds });
}

async function resolveSenderSnapshot(
  prisma: PrismaLike,
  input: PersistMessengerCoreMessageInput,
): Promise<string> {
  if (input.senderNameSnapshot?.trim()) return input.senderNameSnapshot.trim();
  if (!input.senderId) return 'Unknown';
  return snapshotMessengerSenderName(prisma, input.senderId);
}

function coreMessageCreateData(
  conversationId: string,
  input: PersistMessengerCoreMessageInput,
  snapshot: string,
  fileAssetIds: string[],
  direction: NonNullable<PersistMessengerCoreMessageInput['direction']>,
): {
  conversationId: string;
  senderId: string | null;
  senderNameSnapshot: string;
  content: string;
  direction: NonNullable<PersistMessengerCoreMessageInput['direction']>;
  status: 'SENT';
  provenance: NonNullable<PersistMessengerCoreMessageInput['provenance']>;
  replyToMessageId: string | undefined;
  threadRootMessageId: string | undefined;
  idempotencyKey: string | undefined;
  createdAt?: Date;
  metadata?: InputJsonValue;
  attachments?: { create: Array<{ fileAssetId: string; attachedById: string | null }> };
} {
  return {
    conversationId,
    senderId: input.senderId,
    senderNameSnapshot: snapshot,
    content: input.content,
    direction,
    status: 'SENT',
    provenance: input.provenance ?? 'EMPLOYEE',
    replyToMessageId: input.replyToMessageId,
    threadRootMessageId: input.threadRootMessageId,
    idempotencyKey: input.idempotencyKey,
    ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
    attachments:
      fileAssetIds.length > 0
        ? {
            create: fileAssetIds.map((fileAssetId) => ({
              fileAssetId,
              attachedById: input.senderId,
            })),
          }
        : undefined,
  };
}

async function assertOptionalReply(
  prisma: PrismaLike,
  conversationId: string,
  replyToMessageId: string | undefined,
): Promise<void> {
  if (!replyToMessageId) return;
  const replyTo = await prisma.messengerMessage.findUnique({
    where: { id: replyToMessageId },
    select: { conversationId: true },
  });
  if (!replyTo || replyTo.conversationId !== conversationId) {
    throw new NotFoundException('Reply target message not found in this conversation');
  }
}
