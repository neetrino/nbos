import type { PrismaClient } from '@nbos/database';
import type { Socket } from 'socket.io';
import {
  MESSENGER_WS_SERVER_CHANNEL_TYPING,
  MESSENGER_WS_SERVER_DM_TYPING,
  messengerSocketChannelRoom,
  messengerSocketUserRoom,
} from '@nbos/shared';
import {
  canAccessMessengerChannel,
  loadMessengerLegacyAccess,
} from './access/messenger-legacy-channel-access.op';
import { extractChannelId, extractRecipientId } from './messenger-gateway-parse';
import { MessengerTypingThrottle } from './messenger-typing-throttle';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function employeeMayUseMessengerChannel(
  prisma: PrismaLike,
  employeeId: string,
  channelId: string,
): Promise<boolean> {
  const access = await loadMessengerLegacyAccess(prisma, employeeId);
  if (!access || access.viewScope === 'NONE') return false;
  const channel = await prisma.messengerChannel.findUnique({
    where: { id: channelId },
    select: { id: true, projectId: true, type: true },
  });
  if (!channel) return false;
  return canAccessMessengerChannel(prisma, access, channel);
}

export async function messengerTypingDisplayLabel(
  prisma: PrismaLike,
  employeeId: string,
): Promise<string> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { firstName: true },
  });
  const name = employee?.firstName?.trim();
  return name && name.length > 0 ? name : 'Someone';
}

export async function emitLegacyChannelTyping(
  prisma: PrismaLike,
  client: Socket,
  employeeId: string | undefined,
  body: unknown,
  typingThrottle: MessengerTypingThrottle,
): Promise<{ ok: boolean }> {
  if (!employeeId) return { ok: false };
  const channelId = extractChannelId(body);
  if (!channelId) return { ok: false };
  if (!(await employeeMayUseMessengerChannel(prisma, employeeId, channelId))) return { ok: false };
  if (!typingThrottle.allow(client.id)) return { ok: true };
  const label = await messengerTypingDisplayLabel(prisma, employeeId);
  client.to(messengerSocketChannelRoom(channelId)).emit(MESSENGER_WS_SERVER_CHANNEL_TYPING, {
    channelId,
    employeeId,
    label,
  });
  return { ok: true };
}

export async function emitLegacyDmTyping(
  prisma: PrismaLike,
  client: Socket,
  employeeId: string | undefined,
  body: unknown,
  typingThrottle: MessengerTypingThrottle,
): Promise<{ ok: boolean }> {
  if (!employeeId) return { ok: false };
  const recipientId = extractRecipientId(body);
  if (!recipientId || recipientId === employeeId) return { ok: false };
  const recipient = await prisma.employee.findUnique({
    where: { id: recipientId },
    select: { id: true, status: true },
  });
  if (!recipient || recipient.status === 'TERMINATED') return { ok: false };
  if (!typingThrottle.allow(client.id)) return { ok: true };
  const label = await messengerTypingDisplayLabel(prisma, employeeId);
  client.to(messengerSocketUserRoom(recipientId)).emit(MESSENGER_WS_SERVER_DM_TYPING, {
    counterpartId: employeeId,
    employeeId,
    label,
  });
  return { ok: true };
}
