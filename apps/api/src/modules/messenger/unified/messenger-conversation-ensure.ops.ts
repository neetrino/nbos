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
  /** Optional for system/bootstrap paths; participant row only created when set. */
  createdById: string | null;
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

type PrismaLike = InstanceType<typeof PrismaClient>;

const ensuredSelect = {
  id: true,
  type: true,
  title: true,
  status: true,
  canonicalKey: true,
  lastMessageAt: true,
  createdAt: true,
} as const;

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}

/**
 * Idempotent upsert of a canonical Internal Messenger conversation (by canonicalKey).
 * Concurrent creates resolve via unique constraint + re-fetch (no user-facing P2002).
 */
export async function ensureMessengerConversation(
  prisma: PrismaLike,
  input: EnsureConversationInput,
): Promise<EnsuredConversationRow> {
  if (input.type === 'DIRECT') {
    return ensureDirectConversation(prisma, input);
  }
  return ensureEntityConversation(prisma, input);
}

/** Eager Project General helper for Project create / gap-fill (no ACL — caller authorizes). */
export async function ensureProjectGeneralConversation(
  prisma: PrismaLike,
  input: { projectId: string; createdById?: string | null; title?: string },
): Promise<EnsuredConversationRow> {
  const canonicalKey = buildMessengerCanonicalKey('PROJECT_GENERAL', input.projectId);
  let title = input.title?.trim() ?? '';
  if (!title) {
    try {
      const meta = await assertLinkedEntityExists(prisma, 'PROJECT', input.projectId);
      title = meta.title;
    } catch {
      throw new NotFoundException('PROJECT not found');
    }
  }

  const existing = await prisma.messengerConversation.findUnique({
    where: { canonicalKey },
    select: ensuredSelect,
  });
  if (existing) {
    return finalizeExistingEntityConversation(prisma, existing, {
      entityType: 'PROJECT',
      entityId: input.projectId,
      createdById: input.createdById ?? null,
      title,
    });
  }

  try {
    return await prisma.messengerConversation.create({
      data: {
        type: 'PROJECT_GENERAL',
        title,
        status: 'ACTIVE',
        createdById: input.createdById ?? null,
        canonicalKey,
        links: {
          create: {
            entityType: 'PROJECT',
            entityId: input.projectId,
            relationType: 'PRIMARY',
          },
        },
        ...(input.createdById
          ? {
              participants: {
                create: {
                  employeeId: input.createdById,
                  role: 'MEMBER' as const,
                },
              },
            }
          : {}),
      },
      select: ensuredSelect,
    });
  } catch (error) {
    if (!isPrismaUniqueViolation(error)) throw error;
    const raced = await prisma.messengerConversation.findUnique({
      where: { canonicalKey },
      select: ensuredSelect,
    });
    if (!raced) throw error;
    return finalizeExistingEntityConversation(prisma, raced, {
      entityType: 'PROJECT',
      entityId: input.projectId,
      createdById: input.createdById ?? null,
      title,
    });
  }
}

async function ensureEntityConversation(
  prisma: PrismaLike,
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
    select: ensuredSelect,
  });
  if (existing) {
    return finalizeExistingEntityConversation(prisma, existing, {
      entityType,
      entityId: input.entityId,
      createdById: input.createdById,
      title: meta.title,
    });
  }

  try {
    return await prisma.messengerConversation.create({
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
        ...(input.createdById
          ? {
              participants: {
                create: {
                  employeeId: input.createdById,
                  role: 'MEMBER' as const,
                },
              },
            }
          : {}),
      },
      select: ensuredSelect,
    });
  } catch (error) {
    if (!isPrismaUniqueViolation(error)) throw error;
    const raced = await prisma.messengerConversation.findUnique({
      where: { canonicalKey },
      select: ensuredSelect,
    });
    if (!raced) throw error;
    return finalizeExistingEntityConversation(prisma, raced, {
      entityType,
      entityId: input.entityId,
      createdById: input.createdById,
      title: meta.title,
    });
  }
}

async function finalizeExistingEntityConversation(
  prisma: PrismaLike,
  existing: EnsuredConversationRow,
  opts: {
    entityType: 'PROJECT' | 'PRODUCT' | 'DEAL' | 'TASK';
    entityId: string;
    createdById: string | null;
    title: string;
  },
): Promise<EnsuredConversationRow> {
  await prisma.messengerConversationLink.upsert({
    where: {
      conversationId_entityType_entityId_relationType: {
        conversationId: existing.id,
        entityType: opts.entityType,
        entityId: opts.entityId,
        relationType: 'PRIMARY',
      },
    },
    create: {
      conversationId: existing.id,
      entityType: opts.entityType,
      entityId: opts.entityId,
      relationType: 'PRIMARY',
    },
    update: {},
  });

  if (opts.createdById) {
    await prisma.messengerConversationParticipant.upsert({
      where: {
        conversationId_employeeId: {
          conversationId: existing.id,
          employeeId: opts.createdById,
        },
      },
      create: {
        conversationId: existing.id,
        employeeId: opts.createdById,
        role: 'MEMBER',
      },
      update: { leftAt: null },
    });
  }

  if (!existing.title && opts.title) {
    return prisma.messengerConversation.update({
      where: { id: existing.id },
      data: { title: opts.title },
      select: ensuredSelect,
    });
  }
  return existing;
}

async function ensureDirectConversation(
  prisma: PrismaLike,
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
    select: ensuredSelect,
  });
  if (existing) return existing;

  try {
    return await prisma.messengerConversation.create({
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
      select: ensuredSelect,
    });
  } catch (error) {
    if (!isPrismaUniqueViolation(error)) throw error;
    const raced = await prisma.messengerConversation.findUnique({
      where: { canonicalKey },
      select: ensuredSelect,
    });
    if (!raced) throw error;
    return raced;
  }
}
