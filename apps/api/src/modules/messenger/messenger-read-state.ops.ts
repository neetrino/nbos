import type { PrismaClient } from '@nbos/database';
import { messengerChannelUnreadWhere, messengerDmUnreadWhere } from './messenger-unread-where';

export async function countChannelUnreadForEmployee(
  prisma: PrismaClient,
  channelId: string,
  employeeId: string,
): Promise<number> {
  const row = await prisma.messengerChannelReadState.findUnique({
    where: { channelId_employeeId: { channelId, employeeId } },
    select: { lastReadAt: true },
  });
  return prisma.messengerChannelMessage.count({
    where: messengerChannelUnreadWhere(channelId, employeeId, row?.lastReadAt),
  });
}

export async function countDmUnreadForEmployee(
  prisma: PrismaClient,
  threadId: string,
  employeeId: string,
): Promise<number> {
  const row = await prisma.messengerDirectThreadReadState.findUnique({
    where: { threadId_employeeId: { threadId, employeeId } },
    select: { lastReadAt: true },
  });
  return prisma.messengerDirectMessage.count({
    where: messengerDmUnreadWhere(threadId, employeeId, row?.lastReadAt),
  });
}

export async function markChannelReadForEmployee(
  prisma: PrismaClient,
  channelId: string,
  employeeId: string,
): Promise<void> {
  const latest = await prisma.messengerChannelMessage.findFirst({
    where: { channelId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  const lastReadAt = latest?.createdAt ?? new Date();
  await prisma.messengerChannelReadState.upsert({
    where: { channelId_employeeId: { channelId, employeeId } },
    create: { channelId, employeeId, lastReadAt },
    update: { lastReadAt },
  });
}

export async function markDmThreadReadForEmployee(
  prisma: PrismaClient,
  threadId: string,
  employeeId: string,
): Promise<Date> {
  const latest = await prisma.messengerDirectMessage.findFirst({
    where: { threadId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  const lastReadAt = latest?.createdAt ?? new Date();
  await prisma.messengerDirectThreadReadState.upsert({
    where: { threadId_employeeId: { threadId, employeeId } },
    create: { threadId, employeeId, lastReadAt },
    update: { lastReadAt },
  });
  return lastReadAt;
}
