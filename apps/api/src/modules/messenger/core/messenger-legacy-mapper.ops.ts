import { PrismaClient, type TransactionClient } from '@nbos/database';
import { orderedParticipantIds } from '../messenger-participants.util';
import { directCanonicalKey, legacyChannelCanonicalKey } from './messenger-core-canonical-key';
import {
  channelLegacyIdentity,
  channelMessageLegacyIdentity,
  directMessageLegacyIdentity,
  directThreadLegacyIdentity,
} from './messenger-legacy-identity';
import {
  backfillMappedChannelParticipants,
  resolveMappedChannelParticipants,
  type MappedChannelParticipantSeed,
} from './messenger-legacy-mapper-participants.ops';

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
    await backfillMappedChannelIfPresent(prisma, channelId, existing.conversationId);
    return { conversationId: existing.conversationId, created: false, messageCount: 0 };
  }
  const channel = await prisma.messengerChannel.findUnique({
    where: { id: channelId },
    include: {
      messages: { include: { attachments: true }, orderBy: { createdAt: 'asc' } },
      readStates: true,
    },
  });
  if (!channel) return null;
  const participants = await resolveMappedChannelParticipants(prisma, channel);
  return prisma.$transaction((tx) => persistChannelMapping(tx, channel, participants));
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
      readStates: true,
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

type MappedLegacyMessage = {
  id: string;
  senderId: string;
  senderNameSnapshot: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
  attachments: Array<{ fileAssetId: string; attachedById: string | null }>;
};

type MappedLegacyReadState = { employeeId: string; lastReadAt: Date };

async function backfillMappedChannelIfPresent(
  prisma: PrismaClientLike,
  channelId: string,
  conversationId: string,
): Promise<void> {
  const channel = await prisma.messengerChannel.findUnique({
    where: { id: channelId },
    select: { type: true, projectId: true, messages: { select: { senderId: true } } },
  });
  if (!channel) return;
  await backfillMappedChannelParticipants(prisma, conversationId, channel);
}

async function persistChannelMapping(
  tx: TransactionClient,
  channel: {
    id: string;
    name: string;
    projectId: string;
    type: string;
    messages: MappedLegacyMessage[];
    readStates: MappedLegacyReadState[];
  },
  participants: MappedChannelParticipantSeed[],
): Promise<LegacyMapResult> {
  const lastMessageAt = lastMappedActivityAt(channel.messages);
  const conversation = await tx.messengerConversation.create({
    data: {
      zone: 'INTERNAL',
      kind: 'GROUP',
      type: 'INTERNAL_GROUP',
      title: channel.name,
      canonicalKey: legacyChannelCanonicalKey(channel.id),
      lastMessageAt,
      metadata: { legacyChannelType: channel.type, projectId: channel.projectId },
      participants: participantCreate(participants),
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
  await persistMappedReadStates(tx, conversation.id, channel.readStates);
  return { conversationId: conversation.id, created: true, messageCount };
}

async function persistDirectMapping(
  tx: TransactionClient,
  thread: {
    id: string;
    participantAId: string;
    participantBId: string;
    messages: MappedLegacyMessage[];
    readStates: MappedLegacyReadState[];
  },
): Promise<LegacyMapResult> {
  const lastMessageAt = lastMappedActivityAt(thread.messages);
  const conversation = await ensureMappedDirectConversation(tx, thread, lastMessageAt);
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
  await persistMappedReadStates(tx, conversation.id, thread.readStates);
  return { conversationId: conversation.id, created: true, messageCount };
}

async function ensureMappedDirectConversation(
  tx: TransactionClient,
  thread: { participantAId: string; participantBId: string },
  lastMessageAt: Date | null,
): Promise<{ id: string }> {
  const [low, high] = orderedParticipantIds(thread.participantAId, thread.participantBId);
  const canonicalKey = directCanonicalKey(thread.participantAId, thread.participantBId);
  const existing = await tx.messengerConversation.findUnique({ where: { canonicalKey } });
  if (existing) {
    if (lastMessageAt) {
      await tx.messengerConversation.update({
        where: { id: existing.id },
        data: { lastMessageAt },
      });
    }
    return existing;
  }
  return tx.messengerConversation.create({
    data: {
      zone: 'INTERNAL',
      kind: 'DIRECT',
      type: 'DIRECT',
      canonicalKey,
      lastMessageAt,
      directParticipantLowId: low,
      directParticipantHighId: high,
      participants: {
        create: [
          { employeeId: thread.participantAId, role: 'MEMBER' },
          { employeeId: thread.participantBId, role: 'MEMBER' },
        ],
      },
    },
  });
}

function lastMappedActivityAt(messages: Array<{ createdAt: Date }>): Date | null {
  const last = messages[messages.length - 1];
  return last?.createdAt ?? null;
}

function participantCreate(seeds: MappedChannelParticipantSeed[]) {
  if (seeds.length === 0) return undefined;
  return { create: seeds.map((seed) => ({ employeeId: seed.employeeId, role: seed.role })) };
}

async function persistMappedReadStates(
  tx: TransactionClient,
  conversationId: string,
  readStates: MappedLegacyReadState[],
): Promise<void> {
  for (const state of readStates) {
    await tx.messengerConversationReadState.upsert({
      where: { conversationId_employeeId: { conversationId, employeeId: state.employeeId } },
      create: {
        conversationId,
        employeeId: state.employeeId,
        lastReadAt: state.lastReadAt,
      },
      update: { lastReadAt: state.lastReadAt },
    });
  }
}

async function persistMappedMessages(
  tx: TransactionClient,
  conversationId: string,
  messages: MappedLegacyMessage[],
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
