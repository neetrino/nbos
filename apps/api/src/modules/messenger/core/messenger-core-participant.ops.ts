import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { MessengerParticipantRole } from '@nbos/database';
import type { MessengerCoreParticipantDto } from './messenger-core.types';
import {
  bumpGlobalConversationRevision,
  bumpTargetedAccessRemovedRevision,
  bumpTargetedReadRevision,
} from './messenger-core-revision-write.ops';
import { runMessengerWriteTx } from './messenger-core-revision-tx';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function addCoreParticipant(
  prisma: PrismaLike,
  conversationId: string,
  employeeId: string,
  role: MessengerParticipantRole = 'MEMBER',
): Promise<MessengerCoreParticipantDto> {
  return runMessengerWriteTx(prisma, async (tx) => {
    const conversation = await requireConversationZone(tx, conversationId);
    const row = await tx.messengerConversationParticipant.upsert({
      where: {
        conversationId_employeeId: { conversationId, employeeId },
      },
      create: { conversationId, employeeId, role },
      update: { leftAt: null, role },
    });
    await bumpGlobalConversationRevision(tx, conversation.zone, conversationId);
    return { employeeId: row.employeeId, role: row.role, leftAt: row.leftAt };
  });
}

export async function listCoreParticipants(
  prisma: PrismaLike,
  conversationId: string,
): Promise<MessengerCoreParticipantDto[]> {
  const rows = await prisma.messengerConversationParticipant.findMany({
    where: { conversationId },
    orderBy: { joinedAt: 'asc' },
  });
  return rows.map((row) => ({
    employeeId: row.employeeId,
    role: row.role,
    leftAt: row.leftAt,
  }));
}

export async function leaveCoreParticipant(
  prisma: PrismaLike,
  conversationId: string,
  employeeId: string,
): Promise<MessengerCoreParticipantDto | null> {
  return runMessengerWriteTx(prisma, async (tx) => {
    const existing = await tx.messengerConversationParticipant.findUnique({
      where: { conversationId_employeeId: { conversationId, employeeId } },
    });
    if (!existing) return null;
    const conversation = await requireConversationZone(tx, conversationId);
    const row = await tx.messengerConversationParticipant.update({
      where: { id: existing.id },
      data: { leftAt: existing.leftAt ?? new Date() },
    });
    await bumpTargetedAccessRemovedRevision(tx, conversation.zone, employeeId, conversationId);
    return { employeeId: row.employeeId, role: row.role, leftAt: row.leftAt };
  });
}

export async function markCoreConversationRead(
  prisma: PrismaLike,
  conversationId: string,
  employeeId: string,
  lastReadAt: Date,
): Promise<Date> {
  return runMessengerWriteTx(prisma, async (tx) => {
    const conversation = await requireConversationZone(tx, conversationId);
    await tx.messengerConversationReadState.upsert({
      where: {
        conversationId_employeeId: { conversationId, employeeId },
      },
      create: { conversationId, employeeId, lastReadAt },
      update: { lastReadAt },
    });
    await bumpTargetedReadRevision(tx, conversation.zone, employeeId, conversationId);
    return lastReadAt;
  });
}

async function requireConversationZone(
  prisma: PrismaLike,
  conversationId: string,
): Promise<{ zone: 'INTERNAL' | 'CLIENT' }> {
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: { zone: true },
  });
  if (!conversation) {
    throw new NotFoundException('Conversation not found');
  }
  return conversation;
}
