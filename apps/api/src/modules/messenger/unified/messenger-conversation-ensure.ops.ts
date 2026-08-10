import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import {
  buildMessengerCanonicalKey,
  primaryEntityTypeForConversationType,
  type MessengerCanonicalConversationType,
} from '../access/messenger-canonical.util';
import { assertLinkedEntityExists } from '../access/messenger-entity-access.op';
import { orderedParticipantIds } from '../messenger-participants.util';
import { assertActiveEmployeeRecipient } from '../messenger-attachment-access.op';

export type EnsureEntityConversationInput = {
  type: Exclude<MessengerCanonicalConversationType, 'DIRECT'>;
  entityId: string;
  createdById: string;
};

export type EnsureDirectConversationInput = {
  type: 'DIRECT';
  peerEmployeeId: string;
  createdById: string;
};

export type EnsureConversationInput = EnsureEntityConversationInput | EnsureDirectConversationInput;

export type EnsuredConversationRow = {
  id: string;
  type: string;
  title: string | null;
  status: string;
  canonicalKey: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
};

/**
 * Idempotent upsert of a canonical Internal Messenger conversation (by canonicalKey).
 * Creates PRIMARY entity link for non-DIRECT types; DIRECT participants for DMs.
 */
export async function ensureMessengerConversation(
  prisma: InstanceType<typeof PrismaClient>,
  input: EnsureConversationInput,
): Promise<EnsuredConversationRow> {
  if (input.type === 'DIRECT') {
    return ensureDirectConversation(prisma, input);
  }
  return ensureEntityConversation(prisma, input);
}

async function ensureEntityConversation(
  prisma: InstanceType<typeof PrismaClient>,
  input: EnsureEntityConversationInput,
): Promise<EnsuredConversationRow> {
  const entityType = primaryEntityTypeForConversationType(input.type);
  let meta: { title: string; projectId: string | null };
  try {
    meta = await assertLinkedEntityExists(prisma, entityType, input.entityId);
  } catch {
    throw new NotFoundException(`${entityType} not found`);
  }

  const canonicalKey = buildMessengerCanonicalKey(input.type, input.entityId);
  const existing = await prisma.messengerConversation.findUnique({
    where: { canonicalKey },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      canonicalKey: true,
      lastMessageAt: true,
      createdAt: true,
    },
  });
  if (existing) {
    if (!existing.title && meta.title) {
      return prisma.messengerConversation.update({
        where: { id: existing.id },
        data: { title: meta.title },
        select: {
          id: true,
          type: true,
          title: true,
          status: true,
          canonicalKey: true,
          lastMessageAt: true,
          createdAt: true,
        },
      });
    }
    return existing;
  }

  return prisma.messengerConversation.create({
    data: {
      type: input.type,
      title: meta.title,
      status: 'ACTIVE',
      createdById: input.createdById,
      canonicalKey,
      links: {
        create: {
          entityType,
          entityId: input.entityId,
          relationType: 'PRIMARY',
        },
      },
      participants: {
        create: {
          employeeId: input.createdById,
          role: 'MEMBER',
        },
      },
    },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      canonicalKey: true,
      lastMessageAt: true,
      createdAt: true,
    },
  });
}

async function ensureDirectConversation(
  prisma: InstanceType<typeof PrismaClient>,
  input: EnsureDirectConversationInput,
): Promise<EnsuredConversationRow> {
  if (input.peerEmployeeId === input.createdById) {
    throw new NotFoundException('Recipient not found');
  }
  await assertActiveEmployeeRecipient(prisma, input.peerEmployeeId);
  const [low, high] = orderedParticipantIds(input.createdById, input.peerEmployeeId);
  const canonicalKey = buildMessengerCanonicalKey('DIRECT', low, high);

  const existing = await prisma.messengerConversation.findUnique({
    where: { canonicalKey },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      canonicalKey: true,
      lastMessageAt: true,
      createdAt: true,
    },
  });
  if (existing) return existing;

  return prisma.messengerConversation.create({
    data: {
      type: 'DIRECT',
      status: 'ACTIVE',
      createdById: input.createdById,
      canonicalKey,
      directParticipantLowId: low,
      directParticipantHighId: high,
      participants: {
        create: [
          { employeeId: low, role: 'MEMBER' },
          { employeeId: high, role: 'MEMBER' },
        ],
      },
    },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      canonicalKey: true,
      lastMessageAt: true,
      createdAt: true,
    },
  });
}
