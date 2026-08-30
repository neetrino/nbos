import { PrismaClient, type TransactionClient } from '@nbos/database';
import { orderedParticipantIds } from '../messenger-participants.util';
import { directCanonicalKey, legacyChannelCanonicalKey } from './messenger-core-canonical-key';
import {
  channelLegacyIdentity,
  channelMessageLegacyIdentity,
  directMessageLegacyIdentity,
  directThreadLegacyIdentity,
} from './messenger-legacy-identity';

type PrismaClientLike = InstanceType<typeof PrismaClient>;

export type LegacyMapResult = {
  conversationId: string;
  created: boolean;
  messageCount: number;
};

export async function mapLegacyChannelToCore(
  prisma: PrismaClientLike,
  channelId: string,
): Promise<LegacyMapResult | null> {
  const existing = await prisma.messengerLegacyIdentity.findUnique({
    where: {
      sourceKind_sourceId: channelLegacyIdentity(channelId),
    },
  });
  if (existing?.conversationId) {
    return { conversationId: existing.conversationId, created: false, messageCount: 0 };
  }
  const channel = await prisma.messengerChannel.findUnique({
    where: { id: channelId },
    include: {
      messages: { include: { attachments: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!channel) return null;
  return prisma.$transaction((tx) => persistChannelMapping(tx, channel));
}

export async function mapLegacyDirectThreadToCore(
  prisma: PrismaClientLike,
  threadId: string,
): Promise<LegacyMapResult | null> {
  const existing = await prisma.messengerLegacyIdentity.findUnique({
    where: {
      sourceKind_sourceId: directThreadLegacyIdentity(threadId),
    },
  });
  if (existing?.conversationId) {
    return { conversationId: existing.conversationId, created: false, messageCount: 0 };
  }
  const thread = await prisma.messengerDirectThread.findUnique({
    where: { id: threadId },
    include: {
      messages: { include: { attachments: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!thread) return null;
  return prisma.$transaction((tx) => persistDirectMapping(tx, thread));
}

export async function mapAllLegacyInternalToCore(prisma: PrismaClientLike): Promise<{
  channels: number;
  threads: number;
}> {
  const [channels, threads] = await Promise.all([
    prisma.messengerChannel.findMany({ select: { id: true } }),
    prisma.messengerDirectThread.findMany({ select: { id: true } }),
  ]);
  for (const channel of channels) {
    await mapLegacyChannelToCore(prisma, channel.id);
  }
  for (const thread of threads) {
    await mapLegacyDirectThreadToCore(prisma, thread.id);
  }
  return { channels: channels.length, threads: threads.length };
}

async function persistChannelMapping(
  tx: TransactionClient,
  channel: {
    id: string;
    name: string;
    projectId: string;
    type: string;
    messages: Array<{
      id: string;
      senderId: string;
      senderNameSnapshot: string;
      content: string;
      createdAt: Date;
      editedAt: Date | null;
      attachments: Array<{ fileAssetId: string; attachedById: string | null }>;
    }>;
  },
): Promise<LegacyMapResult> {
  const conversation = await tx.messengerConversation.create({
    data: {
      zone: 'INTERNAL',
      kind: 'GROUP',
      type: 'INTERNAL_GROUP',
      title: channel.name,
      canonicalKey: legacyChannelCanonicalKey(channel.id),
      metadata: { legacyChannelType: channel.type, projectId: channel.projectId },
    },
  });
  await tx.messengerLegacyIdentity.create({
    data: {
      ...channelLegacyIdentity(channel.id),
      conversationId: conversation.id,
    },
  });
  const messageCount = await persistMappedMessages(
    tx,
    conversation.id,
    channel.messages,
    'CHANNEL_MESSAGE',
  );
  return { conversationId: conversation.id, created: true, messageCount };
}

async function persistDirectMapping(
  tx: TransactionClient,
  thread: {
    id: string;
    participantAId: string;
    participantBId: string;
    messages: Array<{
      id: string;
      senderId: string;
      senderNameSnapshot: string;
      content: string;
      createdAt: Date;
      editedAt: Date | null;
      attachments: Array<{ fileAssetId: string; attachedById: string | null }>;
    }>;
  },
): Promise<LegacyMapResult> {
  const [low, high] = orderedParticipantIds(thread.participantAId, thread.participantBId);
  const canonicalKey = directCanonicalKey(thread.participantAId, thread.participantBId);
  const conversation =
    (await tx.messengerConversation.findUnique({ where: { canonicalKey } })) ??
    (await tx.messengerConversation.create({
      data: {
        zone: 'INTERNAL',
        kind: 'DIRECT',
        type: 'DIRECT',
        canonicalKey,
        directParticipantLowId: low,
        directParticipantHighId: high,
        participants: {
          create: [
            { employeeId: thread.participantAId, role: 'MEMBER' },
            { employeeId: thread.participantBId, role: 'MEMBER' },
          ],
        },
      },
    }));
  await tx.messengerLegacyIdentity.create({
    data: {
      ...directThreadLegacyIdentity(thread.id),
      conversationId: conversation.id,
    },
  });
  const messageCount = await persistMappedMessages(
    tx,
    conversation.id,
    thread.messages,
    'DIRECT_MESSAGE',
  );
  return { conversationId: conversation.id, created: true, messageCount };
}

async function persistMappedMessages(
  tx: TransactionClient,
  conversationId: string,
  messages: Array<{
    id: string;
    senderId: string;
    senderNameSnapshot: string;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
    attachments: Array<{ fileAssetId: string; attachedById: string | null }>;
  }>,
  sourceKind: 'CHANNEL_MESSAGE' | 'DIRECT_MESSAGE',
): Promise<number> {
  let count = 0;
  for (const message of messages) {
    const identity =
      sourceKind === 'CHANNEL_MESSAGE'
        ? channelMessageLegacyIdentity(message.id)
        : directMessageLegacyIdentity(message.id);
    const already = await tx.messengerLegacyIdentity.findUnique({
      where: { sourceKind_sourceId: identity },
    });
    if (already) continue;
    const created = await tx.messengerMessage.create({
      data: {
        conversationId,
        senderId: message.senderId,
        senderNameSnapshot: message.senderNameSnapshot,
        content: message.content,
        direction: 'INTERNAL',
        status: 'SENT',
        provenance: 'EMPLOYEE',
        createdAt: message.createdAt,
        editedAt: message.editedAt,
        attachments:
          message.attachments.length > 0
            ? {
                create: message.attachments.map((attachment) => ({
                  fileAssetId: attachment.fileAssetId,
                  attachedById: attachment.attachedById,
                })),
              }
            : undefined,
      },
    });
    await tx.messengerLegacyIdentity.create({
      data: { ...identity, conversationId, messageId: created.id },
    });
    count += 1;
  }
  return count;
}
