import { ConflictException } from '@nestjs/common';
import { PrismaClient, classifyDatabaseError, type InputJsonValue } from '@nbos/database';
import type { MessengerCoreConversationDto, MessengerCoreLinkInput } from './messenger-core.types';
import type { EntityParticipantSeed } from './messenger-core-entity-participants.ops';
import { backfillEntityParticipants } from './messenger-core-entity-participants.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type EntityConversationCreateInput = {
  type: 'PRODUCT' | 'WORKSPACE' | 'DEAL' | 'PROJECT_GENERAL';
  title: string;
  createdById: string;
  canonicalKey: string;
  metadata: InputJsonValue;
  links: MessengerCoreLinkInput[];
  participants: EntityParticipantSeed[];
};

export function mapEntityConversation(row: {
  id: string;
  zone: MessengerCoreConversationDto['zone'];
  type: MessengerCoreConversationDto['type'];
  title: string | null;
  status: string;
  canonicalKey: string | null;
  createdAt: Date;
  lastMessageAt: Date | null;
}): MessengerCoreConversationDto {
  return {
    id: row.id,
    zone: row.zone,
    type: row.type,
    title: row.title,
    status: row.status,
    canonicalKey: row.canonicalKey,
    createdAt: row.createdAt,
    lastMessageAt: row.lastMessageAt,
  };
}

export async function findOrCreateEntityConversation(
  prisma: PrismaLike,
  input: EntityConversationCreateInput,
): Promise<{ row: MessengerCoreConversationDto; created: boolean }> {
  const existing = await prisma.messengerConversation.findUnique({
    where: { canonicalKey: input.canonicalKey },
  });
  if (existing) return { row: mapEntityConversation(existing), created: false };
  try {
    const created = await prisma.messengerConversation.create({
      data: {
        zone: 'INTERNAL',
        kind: 'ENTITY',
        type: input.type,
        title: input.title,
        createdById: input.createdById,
        canonicalKey: input.canonicalKey,
        metadata: input.metadata,
        participants: { create: input.participants },
        links: { create: input.links },
      },
    });
    return { row: mapEntityConversation(created), created: true };
  } catch (error) {
    if (classifyDatabaseError(error)?.code !== 'DB_UNIQUE_CONSTRAINT') throw error;
    const raced = await prisma.messengerConversation.findUnique({
      where: { canonicalKey: input.canonicalKey },
    });
    if (!raced) throw new ConflictException('Entity conversation conflict');
    return { row: mapEntityConversation(raced), created: false };
  }
}

export async function attachEntityIdentity(
  prisma: PrismaLike,
  conversationId: string,
  links: MessengerCoreLinkInput[],
  participants: EntityParticipantSeed[],
): Promise<void> {
  if (links.length > 0) {
    await prisma.messengerConversationLink.createMany({
      data: links.map((link) => ({ conversationId, ...link })),
      skipDuplicates: true,
    });
  }
  await backfillEntityParticipants(prisma, conversationId, participants);
}

export async function relinkMappedGroupToEntity(
  prisma: PrismaLike,
  conversationId: string,
  input: EntityConversationCreateInput,
): Promise<MessengerCoreConversationDto> {
  const updated = await prisma.messengerConversation.update({
    where: { id: conversationId },
    data: {
      type: input.type,
      kind: 'ENTITY',
      title: input.title,
      canonicalKey: input.canonicalKey,
      metadata: input.metadata,
    },
  });
  await attachEntityIdentity(prisma, conversationId, input.links, input.participants);
  return mapEntityConversation(updated);
}
