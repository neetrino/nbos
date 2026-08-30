import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaClient, classifyDatabaseError } from '@nbos/database';
import { orderedParticipantIds } from '../messenger-participants.util';
import { directCanonicalKey } from './messenger-core-canonical-key';
import { assertZoneTypeCompatibility } from './messenger-core-zone';
import type {
  CreateMessengerCoreConversationInput,
  MessengerCoreConversationDto,
  MessengerCoreLinkInput,
} from './messenger-core.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

function mapConversation(row: {
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

function directPairOrThrow(
  createdById: string,
  peerEmployeeId: string | undefined,
): {
  low: string;
  high: string;
  canonicalKey: string;
} {
  if (!peerEmployeeId || peerEmployeeId === createdById) {
    throw new BadRequestException('DIRECT conversations require a distinct peer employee');
  }
  const [low, high] = orderedParticipantIds(createdById, peerEmployeeId);
  return { low, high, canonicalKey: directCanonicalKey(createdById, peerEmployeeId) };
}

export async function createCoreConversation(
  prisma: PrismaLike,
  input: CreateMessengerCoreConversationInput,
): Promise<MessengerCoreConversationDto> {
  assertZoneTypeCompatibility(input.zone, input.type);
  if (input.type === 'DIRECT') {
    return ensureDirectConversation(prisma, input);
  }
  const created = await prisma.messengerConversation.create({
    data: {
      zone: input.zone,
      kind: kindFor(input.zone, input.type),
      type: input.type,
      title: input.title,
      createdById: input.createdById,
      participants: {
        create: uniqueParticipantIds(input).map((employeeId) => ({
          employeeId,
          role: employeeId === input.createdById ? 'OWNER' : 'MEMBER',
        })),
      },
      links: linkCreate(input.links),
    },
  });
  return mapConversation(created);
}

export async function ensureDirectConversation(
  prisma: PrismaLike,
  input: CreateMessengerCoreConversationInput,
): Promise<MessengerCoreConversationDto> {
  assertZoneTypeCompatibility(input.zone, 'DIRECT');
  if (input.zone !== 'INTERNAL') {
    throw new BadRequestException('DIRECT conversations are Internal-only');
  }
  const pair = directPairOrThrow(input.createdById, input.peerEmployeeId);
  const existing = await prisma.messengerConversation.findUnique({
    where: { canonicalKey: pair.canonicalKey },
  });
  if (existing) return mapConversation(existing);
  try {
    const created = await prisma.messengerConversation.create({
      data: {
        zone: 'INTERNAL',
        kind: 'DIRECT',
        type: 'DIRECT',
        title: input.title,
        createdById: input.createdById,
        canonicalKey: pair.canonicalKey,
        directParticipantLowId: pair.low,
        directParticipantHighId: pair.high,
        participants: {
          create: [
            { employeeId: pair.low, role: 'MEMBER' },
            { employeeId: pair.high, role: 'MEMBER' },
          ],
        },
      },
    });
    return mapConversation(created);
  } catch (error) {
    if (classifyDatabaseError(error)?.code !== 'DB_UNIQUE_CONSTRAINT') throw error;
    const raced = await prisma.messengerConversation.findUnique({
      where: { canonicalKey: pair.canonicalKey },
    });
    if (!raced) throw new ConflictException('DIRECT conversation conflict');
    return mapConversation(raced);
  }
}

export async function getCoreConversation(
  prisma: PrismaLike,
  conversationId: string,
): Promise<MessengerCoreConversationDto | null> {
  const row = await prisma.messengerConversation.findUnique({ where: { id: conversationId } });
  return row ? mapConversation(row) : null;
}

function uniqueParticipantIds(input: CreateMessengerCoreConversationInput): string[] {
  const ids = new Set<string>([input.createdById, ...(input.participantIds ?? [])]);
  return [...ids];
}

function linkCreate(links?: MessengerCoreLinkInput[]) {
  if (!links || links.length === 0) return undefined;
  return {
    create: links.map((link) => ({
      entityType: link.entityType,
      entityId: link.entityId,
      relationType: link.relationType,
    })),
  };
}

function kindFor(
  zone: CreateMessengerCoreConversationInput['zone'],
  type: CreateMessengerCoreConversationInput['type'],
): 'DIRECT' | 'GROUP' | 'ENTITY' | 'EXTERNAL' {
  if (zone === 'CLIENT' || type === 'EXTERNAL') return 'EXTERNAL';
  if (type === 'DIRECT') return 'DIRECT';
  if (type === 'INTERNAL_GROUP') return 'GROUP';
  return 'ENTITY';
}
