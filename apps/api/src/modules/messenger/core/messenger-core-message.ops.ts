import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { snapshotMessengerSenderName } from '../messenger-prisma-message.mapper';
import { assertMessageDirectionForZone, defaultDirectionForZone } from './messenger-core-zone';
import type {
  MessengerCoreMessageDto,
  PersistMessengerCoreMessageInput,
} from './messenger-core.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

function mapMessage(row: {
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
}): MessengerCoreMessageDto {
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
  };
}

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
      include: { attachments: true },
    });
    if (existing) return mapMessage(existing);
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
  const snapshot = await snapshotMessengerSenderName(prisma, input.senderId);
  const created = await prisma.messengerMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: input.senderId,
      senderNameSnapshot: snapshot,
      content: input.content,
      direction,
      status: 'SENT',
      provenance: input.provenance ?? 'EMPLOYEE',
      replyToMessageId: input.replyToMessageId,
      threadRootMessageId: input.threadRootMessageId,
      idempotencyKey: input.idempotencyKey,
      attachments:
        fileAssetIds.length > 0
          ? {
              create: fileAssetIds.map((fileAssetId) => ({
                fileAssetId,
                attachedById: input.senderId,
              })),
            }
          : undefined,
    },
    include: { attachments: true },
  });
  await prisma.messengerConversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: created.createdAt },
  });
  return mapMessage(created);
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
