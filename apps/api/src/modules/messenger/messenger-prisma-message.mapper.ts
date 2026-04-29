import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { MessengerMessageDto } from './messenger.types';

type PrismaEmp = Pick<PrismaClient, 'employee'>;

export function mapPrismaChannelMessageToDto(m: {
  id: string;
  channelId: string;
  senderId: string;
  senderNameSnapshot: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
}): MessengerMessageDto {
  return {
    id: m.id,
    channelId: m.channelId,
    senderId: m.senderId,
    senderName: m.senderNameSnapshot,
    content: m.content,
    createdAt: m.createdAt,
    editedAt: m.editedAt,
  };
}

export function mapPrismaDmMessageToDto(
  m: {
    id: string;
    senderId: string;
    senderNameSnapshot: string;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
  },
  threadId: string,
): MessengerMessageDto {
  return {
    id: m.id,
    channelId: threadId,
    senderId: m.senderId,
    senderName: m.senderNameSnapshot,
    content: m.content,
    createdAt: m.createdAt,
    editedAt: m.editedAt,
  };
}

export async function snapshotMessengerSenderName(
  prisma: PrismaEmp,
  senderId: string,
): Promise<string> {
  const emp = await prisma.employee.findUnique({
    where: { id: senderId },
    select: { firstName: true, lastName: true, email: true },
  });
  if (!emp) {
    throw new NotFoundException('Sender employee not found');
  }
  const full = `${emp.firstName} ${emp.lastName}`.trim();
  return full.length > 0 ? full : emp.email;
}
