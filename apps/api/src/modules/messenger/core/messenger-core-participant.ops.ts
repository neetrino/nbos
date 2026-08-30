import { PrismaClient } from '@nbos/database';
import type { MessengerParticipantRole } from '@nbos/database';
import type { MessengerCoreParticipantDto } from './messenger-core.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function addCoreParticipant(
  prisma: PrismaLike,
  conversationId: string,
  employeeId: string,
  role: MessengerParticipantRole = 'MEMBER',
): Promise<MessengerCoreParticipantDto> {
  const row = await prisma.messengerConversationParticipant.upsert({
    where: {
      conversationId_employeeId: { conversationId, employeeId },
    },
    create: { conversationId, employeeId, role },
    update: { leftAt: null, role },
  });
  return { employeeId: row.employeeId, role: row.role, leftAt: row.leftAt };
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
  const existing = await prisma.messengerConversationParticipant.findUnique({
    where: { conversationId_employeeId: { conversationId, employeeId } },
  });
  if (!existing) return null;
  const row = await prisma.messengerConversationParticipant.update({
    where: { id: existing.id },
    data: { leftAt: existing.leftAt ?? new Date() },
  });
  return { employeeId: row.employeeId, role: row.role, leftAt: row.leftAt };
}

export async function markCoreConversationRead(
  prisma: PrismaLike,
  conversationId: string,
  employeeId: string,
  lastReadAt: Date,
): Promise<void> {
  await prisma.messengerConversationReadState.upsert({
    where: {
      conversationId_employeeId: { conversationId, employeeId },
    },
    create: { conversationId, employeeId, lastReadAt },
    update: { lastReadAt },
  });
}
